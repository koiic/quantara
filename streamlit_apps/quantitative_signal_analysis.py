import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import duckdb
import os

st.set_page_config(page_title='Quantitative Signal Analysis', layout='wide')
st.title('Quantitative Signal Analysis')
st.markdown('*Generated directly from Quantara Notebook for Stakeholders & Executive Presentation*')
st.markdown('---')

st.markdown("""# BTC-USD Signal Strategy
Calculates 20-day Simple Moving Average (SMA) and 2-standard-deviation Bollinger Bands for mean-reversion detection.""")

# --- Cell 2 ---
import yfinance as yf
import plotly.graph_objects as go
from plotly.subplots import make_subplots

print("Fetching BTC-USD Market Data...")
ticker = yf.Ticker("BTC-USD")
df = ticker.history(period="3mo")

# Calculate Technical Indicators
df["SMA_20"] = df["Close"].rolling(window=20).mean()
df["BB_Upper"] = df["SMA_20"] + 2 * df["Close"].rolling(window=20).std()
df["BB_Lower"] = df["SMA_20"] - 2 * df["Close"].rolling(window=20).std()

print("Rendering Interactive Chart...")

# --- Cell 3 ---
fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.05, row_heights=[0.7, 0.3])

# Candlestick
fig.add_trace(go.Candlestick(x=df.index, open=df["Open"], high=df["High"], low=df["Low"], close=df["Close"], name="BTC"), row=1, col=1)

# Bollinger Bands & SMA
fig.add_trace(go.Scatter(x=df.index, y=df["SMA_20"], name="SMA 20", line=dict(color="#2383e2")), row=1, col=1)
fig.add_trace(go.Scatter(x=df.index, y=df["BB_Upper"], name="BB Upper", line=dict(color="rgba(100,100,100,0.3)", dash="dash")), row=1, col=1)
fig.add_trace(go.Scatter(x=df.index, y=df["BB_Lower"], name="BB Lower", line=dict(color="rgba(100,100,100,0.3)", dash="dash"), fill="tonexty"), row=1, col=1)

# Volume
fig.add_trace(go.Bar(x=df.index, y=df["Volume"], name="Volume", marker_color="#0f7b6c"), row=2, col=1)

fig.update_layout(title="BTC-USD Technical Signals (Interactive)", height=600, template="plotly_white", margin=dict(l=20, r=20, t=50, b=20))
st.plotly_chart(fig, use_container_width=True)
