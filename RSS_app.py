import streamlit as st
import datetime
from RSS.rss_sources import rss_sources
from RSS.rss_fetcher import fetch_rss_entries
from Database.db_utils import save_news_status

def run():  
    st.set_page_config(page_title="RSS RSS News Viewer", layout="wide")
    st.title("📰 Neural News")

    st.markdown("""
        <style>
        /* Base styles for all devices */
        .rss-card {
            background-color: #0e1117;
            border: 1px solid #333;
            border-radius: 10px;
            padding: 15px;
            min-height: 350px;
            display: flex;
            flex-direction: column;
            margin-bottom: 20px;
            box-sizing: border-box;
        }
        
        .rss-image {
            height: 150px;
            object-fit: cover;
            width: 100%;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .rss-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f77ff;
            line-height: 1.3;
            margin-bottom: 8px;
        }
        
        .rss-meta {
            font-size: 14px;
            color: #ccc;
            margin-bottom: 5px;
            line-height: 1.4;
        }
        
        .checkbox-container {
            display: flex;
            justify-content: flex-start;
            gap: 10px;
            margin-top: 10px;
        }
        
        div.css-1aumxhk.edgvbvh3 {
            max-height: 80px;
            overflow-y: auto;
        }
        
        /* Mobile styles (up to 768px) */
        @media (max-width: 768px) {
            .rss-card {
                min-height: 320px;
                padding: 12px;
                margin-bottom: 15px;
            }
            
            .rss-image {
                height: 120px;
                margin-bottom: 8px;
            }
            
            .rss-title {
                font-size: 14px;
                margin-bottom: 6px;
            }
            
            .rss-meta {
                font-size: 12px;
                margin-bottom: 4px;
            }
            
            /* Make filter controls stack vertically on mobile */
            .stMultiSelect > div > div {
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
                min-height: 40px;
                padding: 14px;
            }
            
            .rss-image {
                height: 140px;
            }
            
            .rss-title {
                font-size: 15px;
            }
            
            .rss-meta {
                font-size: 13px;
            }
        }
        
        /* Desktop styles (1025px and up) */
        @media (min-width: 1025px) {
            .rss-card {
                min-height: 419px;
                padding: 15px;
            }
            
            .rss-image {
                height: 180px;
            }
            
            .rss-title {
                font-size: 17px;
            }
            
            .rss-meta {
                font-size: 15px;
            }
        }
        
        /* Large desktop styles (1440px and up) */
        @media (min-width: 1440px) {
            .rss-card {
                min-height: 40px;
                padding: 18px;
            }
            
            .rss-image {
                height: 200px;
            }
            
            .rss-title {
                font-size: 18px;
            }
            
            .rss-meta {
                font-size: 16px;
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
        </style>
    """, unsafe_allow_html=True)

    # Map source display name to key
    source_name_map = {name: key for key, (name, _) in rss_sources.items()}
    source_names = list(source_name_map.keys())

    # Responsive layout for filter controls
    # On mobile, these will stack vertically due to CSS
    col1, col2, col3, col4 = st.columns([3, 2, 2, 3])

    with col1:
        selected_source_names = st.multiselect("Choose RSS Source(s)", source_names)

    with col2:
        start_date = st.date_input("Start Date", datetime.date.today() - datetime.timedelta(days=30))

    with col3:
        end_date = st.date_input("End Date", datetime.date.today())

    with col4:
        keyword = st.text_input("Keyword in Title or Description")

    def filter_entry(entry, start_date, end_date, keyword):
        pub_date = entry.get("published_date", "")
        if not pub_date:
            return False
        try:
            entry_date = datetime.datetime.strptime(pub_date, "%Y-%m-%d").date()
        except Exception:
            return False
        if not (start_date <= entry_date <= end_date):
            return False
        if keyword:
            text = (entry.get("title", "") + entry.get("description", "")).lower()
            if keyword.lower() not in text:
                return False
        return True

    if selected_source_names:
        all_filtered_entries = []
        for selected_source_name in selected_source_names:
            selected_key = source_name_map[selected_source_name]
            source_name, source_url = rss_sources[selected_key]
            entries = fetch_rss_entries(source_url, source_name)
            filtered_entries = [e for e in entries if filter_entry(e, start_date, end_date, keyword)]
            all_filtered_entries.extend(filtered_entries)

        def parse_date(e):
            try:
                return datetime.datetime.strptime(e.get("published_date", "1900-01-01"), "%Y-%m-%d")
            except Exception:
                return datetime.datetime(1900, 1, 1)

        all_filtered_entries.sort(key=parse_date, reverse=True)
        st.markdown(f"### 🔍 Showing {len(all_filtered_entries)} filtered result(s) from: {', '.join(selected_source_names)}")

        if all_filtered_entries:
            # Responsive card layout
            # Cards per row based on screen size:
            # Mobile: 1 card per row
            # Tablet: 2 cards per row  
            # Desktop: 3-4 cards per row
            
            # We'll use JavaScript to detect screen size and adjust accordingly
            # For now, we'll use a base of 2 cards per row which works well on most devices
            cards_per_row = 4
            
            # Use container to better control layout
            with st.container():
                rows = (len(all_filtered_entries) + cards_per_row - 1) // cards_per_row

                for row in range(rows):
                    cols = st.columns(cards_per_row)
                    for col_idx in range(cards_per_row):
                        idx = row * cards_per_row + col_idx
                        if idx >= len(all_filtered_entries):
                            break

                        entry = all_filtered_entries[idx]
                        with cols[col_idx]:
                            title = entry["title"]
                            # Responsive title truncation
                            short_title = title if len(title) <= 70 else title[:67] + "..."
                            desc = entry.get("description", "")
                            # Responsive description truncation
                            short_desc = desc if len(desc) <= 120 else desc[:117] + "..."
                            link = entry["link"]

                            image_html = ""
                            if entry.get("image"):
                                image_html = f'<img src="{entry["image"]}" class="rss-image" />'

                            html_card = f"""
                            <div class="rss-card">
                                {image_html}
                                <div class="rss-title"><a href="{link}" target="_blank">{short_title}</a></div>
                                <div class="rss-meta"><strong>Source:</strong> {entry['source']}</div>
                                <div class="rss-meta"><strong>Description:</strong> {short_desc}</div>
                                <div class="rss-meta"><strong>Date:</strong> {entry['published_date']}</div>
                            </div>
                            """
                            st.markdown(html_card, unsafe_allow_html=True)

                            accept_key = f"accept_checkbox_{idx}"
                            reject_key = f"reject_checkbox_{idx}"

                            def on_accept_change(entry=entry, accept_key=accept_key, reject_key=reject_key):
                                if st.session_state[accept_key]:
                                    st.session_state[reject_key] = False
                                    save_news_status(entry, "Accepted")
                                else:
                                    save_news_status(entry, "Pending")

                            def on_reject_change(entry=entry, accept_key=accept_key, reject_key=reject_key):
                                if st.session_state[reject_key]:
                                    st.session_state[accept_key] = False
                                    save_news_status(entry, "Rejected")
                                else:
                                    save_news_status(entry, "Pending")

                            # Responsive checkbox layout
                            cols_check = st.columns([1, 1])
                            with cols_check[0]:
                                st.checkbox("Accept", key=accept_key, on_change=on_accept_change)
                            with cols_check[1]:
                                st.checkbox("Reject", key=reject_key, on_change=on_reject_change)

                    if row < rows - 1:
                        st.markdown("<br>", unsafe_allow_html=True)

        else:
            st.warning("No entries match the selected filters.")
    else:
        st.info("Please select at least one RSS source.")