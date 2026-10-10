from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
import bcrypt

from database import get_user_by_username, create_user, get_user_by_email, init_db

# Ensure database tables exist
init_db()

# --- Security Config ---
SECRET_KEY = "nexus_super_secret_key_for_auto_trading_mvp"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

router = APIRouter(prefix="/api/auth", tags=["auth"])

# --- Utils ---
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

# --- Models ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: str

class UserRegisterRequest(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    email: Optional[str] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user_dict = get_user_by_username(token_data.username)
    if user_dict is None:
        raise credentials_exception
    return User(
        username=user_dict["username"],
        full_name=user_dict["full_name"],
        email=user_dict["email"],
        role=user_dict["role"]
    )

# --- Routes ---
@router.post("/register", response_model=Token)
async def register_user(req: UserRegisterRequest):
    username = req.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters.")
    
    # Check if username exists
    if get_user_by_username(username):
        raise HTTPException(status_code=400, detail="Username already registered.")
    
    # Check email if provided
    email = req.email.strip() if req.email else None
    if email and get_user_by_email(email):
        raise HTTPException(status_code=400, detail="Email already registered with another account.")
        
    hashed_password = get_password_hash(req.password)
    user_dict = create_user(
        username=username,
        hashed_password=hashed_password,
        full_name=req.full_name.strip() if req.full_name else username,
        email=email,
        role="user"
    )
    
    access_token = create_access_token(
        data={"sub": user_dict["username"], "role": user_dict["role"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user_dict = get_user_by_username(form_data.username)
    if not user_dict or not verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = User(
        username=user_dict["username"],
        full_name=user_dict["full_name"],
        email=user_dict["email"],
        role=user_dict["role"]
    )
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
