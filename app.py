import streamlit as st

# Page configuration
st.set_page_config(page_title="Neural News Hub", layout="wide")

# Top tab navigation
tabs = st.tabs(["📰 RSS News Fetcher", "🗂️ Filtered News Viewer"])

with tabs[0]:
    from RSS_app import run as run_rss_app
    run_rss_app()

with tabs[1]:
    from DB_app import run as run_db_app
    run_db_app()
