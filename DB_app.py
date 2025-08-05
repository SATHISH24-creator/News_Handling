import streamlit as st
import datetime
from pymongo import MongoClient

def run():
    st.set_page_config(page_title="🗂️ Filtered News Contents", layout="wide")
    st.title("🗂️ Filtered News")

    # Checkbox to switch layout mode (same as RSS_app.py)
    mobile_mode = st.checkbox("Switch to Mobile Layout", key="db_mobile_mode")

    # MongoDB connection
    mongo_uri = st.secrets["mongodb"]["uri"]
    client = MongoClient(mongo_uri)
    collection = client["Main_DB"]["Neural_News"]

    # Filters
    col1, col2, col3, col4 = st.columns([3, 2, 2, 3])
    with col1:
        status_filter = st.selectbox("Filter by Status", options=["All", "Accepted", "Rejected"])
    with col2:
        start_date = st.date_input("From Date", datetime.date.today() - datetime.timedelta(days=30))
    with col3:
        end_date = st.date_input("To Date", datetime.date.today())
    with col4:
        keyword_filter = st.text_input("Filter by Keyword (in title or description)")

    # Query MongoDB
    query = {
        "saved_at": {
            "$gte": datetime.datetime.combine(start_date, datetime.time.min),
            "$lte": datetime.datetime.combine(end_date, datetime.time.max)
        }
    }
    if status_filter != "All":
        query["status"] = status_filter
    if keyword_filter.strip():
        query["$or"] = [
            {"title": {"$regex": keyword_filter, "$options": "i"}},
            {"description": {"$regex": keyword_filter, "$options": "i"}}
        ]

    entries = list(collection.find(query).sort("saved_at", -1))

    st.markdown("### 📋 Available News")

    if entries:
        if not mobile_mode:
            # Desktop layout with columns
            header_cols = st.columns([2.5, 3.5, 1.5, 1.5, 1])
            header_cols[0].markdown('<div style="text-align: center; font-weight: bold;">Title</div>', unsafe_allow_html=True)
            header_cols[1].markdown('<div style="text-align: center; font-weight: bold;">Description</div>', unsafe_allow_html=True)
            header_cols[2].markdown('<div style="text-align: center; font-weight: bold;">Published Date</div>', unsafe_allow_html=True)
            header_cols[3].markdown('<div style="text-align: center; font-weight: bold;">Source</div>', unsafe_allow_html=True)
            header_cols[4].markdown('<div style="text-align: center; font-weight: bold;">Status</div>', unsafe_allow_html=True)
            st.markdown("---")

            for entry in entries:
                cols = st.columns([2.5, 3.5, 1.5, 1.5, 1])
                with cols[0]:
                    title = entry.get("title", "No Title")
                    link = entry.get("link", "#")
                    st.markdown(f"[{title}]({link})", unsafe_allow_html=True)
                with cols[1]:
                    desc = entry.get("description", "") or "No description"
                    short_desc = desc[:200] + "..." if len(desc) > 200 else desc
                    st.markdown(short_desc)
                with cols[2]:
                    published_date = entry.get("published_date", "N/A")
                    st.markdown(f'<div style="text-align: center;">{published_date}</div>', unsafe_allow_html=True)
                with cols[3]:
                    source = entry.get("source", "Unknown")
                    st.markdown(f'<div style="text-align: center;">{source}</div>', unsafe_allow_html=True)
                with cols[4]:
                    status = entry.get("status", "Unknown")
                    status_color = "🟢" if status == "Accepted" else "🔴" if status == "Rejected" else "⚪"
                    st.markdown(f'<div style="text-align: center;">{status_color} {status}</div>', unsafe_allow_html=True)
                st.markdown("---")

        else:
            # Mobile layout stacked vertically with explicit labels
            for entry in entries:
                title = entry.get("title", "No Title")
                link = entry.get("link", "#")
                desc = entry.get("description", "") or "No description"
                short_desc = desc[:200] + "..." if len(desc) > 200 else desc
                published_date = entry.get("published_date", "N/A")
                source = entry.get("source", "Unknown")
                status = entry.get("status", "Unknown")
                status_color = "🟢" if status == "Accepted" else "🔴" if status == "Rejected" else "⚪"

                st.markdown(f"**Title:** [{title}]({link})")
                st.markdown(f"**Description:** {short_desc}")
                st.markdown(f"**Published Date:** {published_date}")
                st.markdown(f"**Source:** {source}")
                st.markdown(f"**Status:** {status_color} {status}")
                st.markdown("---")

    else:
        st.warning("No entries found in the selected date/status/keyword range.")

if __name__ == "__main__":
    run()