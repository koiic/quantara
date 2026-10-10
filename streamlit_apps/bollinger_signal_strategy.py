import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import duckdb
import os

st.set_page_config(page_title='Bollinger Signal Strategy', layout='wide')
st.title('Bollinger Signal Strategy')
st.markdown('*Generated directly from Quantara Notebook for Stakeholders & Executive Presentation*')
st.markdown('---')

st.markdown("""# Alpha Strategy
Tested against BTC""")

# --- Cell 2 ---
print("Strategy Ready")
