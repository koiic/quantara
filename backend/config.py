import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Quantara Execution Engine"
    kernel_name: str = "python3"
    execution_timeout_seconds: int = 120
    data_lake_path: str = "../datalake"

    class Config:
        env_file = ".env"

settings = Settings()
