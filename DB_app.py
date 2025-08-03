import streamlit as st
import datetime
from pymongo import MongoClient

def run():
    st.set_page_config(page_title="Saved News Viewer", layout="wide")
    st.title("🗂️ Filtered News Contents")

    # MongoDB connection
    mongo_uri = st.secrets["mongodb"]["uri"]
    client = MongoClient(mongo_uri)
    collection = client["Main_DB"]["Neural_News"]

    # Responsive CSS
    st.markdown("""
        <style>
        /* Base styles for all devices */
        .rss-card {
            background-color: #0e1117;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 20px;
            min-height: 400px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 10px;
            box-sizing: border-box;
        }
        
        .rss-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f77ff;
            margin: 0 0 8px;
            line-height: 1.3;
        }
        
        .rss-meta {
            font-size: 14px;
            color: #ccc;
            margin: 4px 0;
            line-height: 1.4;
        }
        
        .rss-status {
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            display: inline-block;
            margin-top: 8px;
        }
        
        .accepted {
            background-color: #166534;
            color: white;
        }
        
        .rejected {
            background-color: #7f1d1d;
            color: white;
        }
        
        img {
            border-radius: 8px;
            margin-bottom: 8px;
            width: 100%;
            height: 150px;
            object-fit: cover;
        }
        
        /* Mobile styles (up to 768px) */
        @media (max-width: 768px) {
            .rss-card {
                padding: 15px;
                min-height: 30px;
                margin-bottom: 15px;
            }
            
            .rss-title {
                font-size: 14px;
                margin-bottom: 6px;
            }
            
            .rss-meta {
                font-size: 12px;
                margin: 3px 0;
            }
            
            .rss-status {
                font-size: 11px;
                padding: 2px 6px;
                margin-top: 6px;
            }
            
            img {
                height: 120px;
                margin-bottom: 6px;
            }
            
            /* Make filter controls stack better on mobile */
            .stSelectbox > div > div {
                font-size: 14px;
            }
            
            .stDateInput > div > div > input {
                font-size: 14px;
            }
            
            .stTextInput > div > div > input {
                font-size: 14px;
            }
        }
        
        /* Tablet styles (769px to 1024px) */
        @media (min-width: 769px) and (max-width: 1024px) {
            .rss-card {
                padding: 18px;
                min-height: 40px;
            }
            
            .rss-title {
                font-size: 15px;
            }
            
            .rss-meta {
                font-size: 13px;
            }
            
            .rss-status {
                font-size: 12px;
            }
            
            img {
                height: 140px;
            }
        }
        
        /* Desktop styles (1025px and up) */
        @media (min-width: 1025px) {
            .rss-card {
                padding: 20px;
                min-height: 490px;
            }
            
            .rss-title {
                font-size: 17px;
            }
            
            .rss-meta {
                font-size: 14px;
            }
            
            .rss-status {
                font-size: 13px;
            }
            
            img {
                height: 150px;
            }
        }
        
        /* Large desktop styles (1440px and up) */
        @media (min-width: 1440px) {
            .rss-card {
                padding: 22px;
                min-height: 480px;
            }
            
            .rss-title {
                font-size: 18px;
            }
            
            .rss-meta {
                font-size: 15px;
            }
            
            .rss-status {
                font-size: 14px;
                padding: 4px 10px;
            }
            
            img {
                height: 170px;
            }
        }
        
        /* Streamlit column overrides for better mobile experience */
        @media (max-width: 768px) {
            .stColumns {
                flex-direction: column;
            }
            
            .stColumn {
                width: 100% !important;
                margin-bottom: 10px;
            }
        }
        
        /* Tablet column adjustments */
        @media (min-width: 769px) and (max-width: 1024px) {
            .stColumn {
                margin-bottom: 8px;
            }
        }
        </style>
    """, unsafe_allow_html=True)

    # Responsive filter section
    # On mobile, these will stack vertically due to CSS
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
        "timestamp": {
            "$gte": datetime.datetime.combine(start_date, datetime.time.min),
            "$lte": datetime.datetime.combine(end_date, datetime.time.max)
        }
    }
    if status_filter != "All":
        query["status"] = status_filter

    if keyword_filter.strip():
        # Case-insensitive regex search on title or description
        query["$or"] = [
            {"title": {"$regex": keyword_filter, "$options": "i"}},
            {"description": {"$regex": keyword_filter, "$options": "i"}}
        ]

    entries = list(collection.find(query).sort("timestamp", -1))

    st.markdown(f"### 📋 Available News")

    # Display cards with responsive layout
    if entries:
        # Responsive card layout
        # Cards per row based on screen size:
        # Mobile: 1 card per row
        # Tablet: 2 cards per row  
        # Desktop: 3-4 cards per row
        
        # Using 2 cards per row as base for better responsiveness
        cards_per_row = 4
        
        # Use container to better control layout
        with st.container():
            rows = (len(entries) + cards_per_row - 1) // cards_per_row

            for row in range(rows):
                cols = st.columns(cards_per_row)
                for col_idx in range(cards_per_row):
                    idx = row * cards_per_row + col_idx
                    if idx >= len(entries):
                        break

                    entry = entries[idx]
                    with cols[col_idx]:
                        title = entry.get("title", "No Title")
                        # Responsive title truncation
                        short_title = title if len(title) <= 70 else title[:67] + "..."
                        desc = entry.get("description", "")
                        # Responsive description truncation
                        short_desc = desc if len(desc) <= 120 else desc[:117] + "..."
                        published_date = entry.get("published_date", "Not specified")
                        source = entry.get("source", "Unknown")
                        link = entry.get("link", "#")
                        status = entry.get("status", "Unknown")
                        status_class = "accepted" if status == "Accepted" else "rejected"
                        image_url = entry.get("image", None)
                        image_html = f'<img src="{image_url}" alt="Image">' if image_url else ""

                        html_card = f"""
                        <div class="rss-card">
                            {image_html}
                            <div class="rss-title"><a href="{link}" target="_blank">{short_title}</a></div>
                            <div class="rss-meta"><strong>Description:</strong> {short_desc}</div>
                            <div class="rss-meta"><strong>Date:</strong> {published_date}</div>
                            <div class="rss-meta"><strong>Source:</strong> {source}</div>
                            <div class="rss-meta">
                                <span class="rss-status {status_class}">{status}</span>
                            </div>
                        </div>
                        """
                        st.markdown(html_card, unsafe_allow_html=True)

                if row < rows - 1:
                    st.markdown("<br>", unsafe_allow_html=True)
    else:
        st.warning("No entries found in the selected date/status/keyword range.")