import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import duckdb
import os

st.set_page_config(page_title='Initial Workspace', layout='wide')
st.title('Initial Workspace')
st.markdown('*Generated directly from Quantara Notebook for Stakeholders & Executive Presentation*')
st.markdown('---')

st.markdown("""# Welcome to Quantara
Select a template from the sidebar or click **+ Code Block** below to begin.""")

# --- Cell 2 ---
print("Quantara Python kernel initialized.")
