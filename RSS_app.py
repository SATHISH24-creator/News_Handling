import streamlit as st
import datetime
from RSS.rss_sources import rss_sources
from RSS.rss_fetcher import fetch_rss_entries
from Database.db_utils import save_news_status

def run():
    st.title("📰 News Arena")

    st.markdown("""
        <style>
        .block-container {
            padding-top: 1rem;
        }
        div[data-testid="column"] {
            align-items: start !important;
            padding-left: 0.3rem;
        }
        .date-cell {
            text-align: center;
            width: 100%;
            display: block;
        }
        .stButton > button {
            padding: 0.2rem 0.5rem;
            font-size: 0.8rem;
        }
        [data-testid="stSelectbox"] > div > div {
            max-width: 150px !important;
        }
        </style>
    """, unsafe_allow_html=True)

    # Checkbox to switch layout mode
    mobile_mode = st.checkbox("Switch to Mobile Layout")

    col1, col2, col3 = st.columns(3)
    with col1:
        start_date = st.date_input("Start Date", datetime.date.today() - datetime.timedelta(days=7))
    with col2:
        end_date = st.date_input("End Date", datetime.date.today())
    with col3:
        keyword = st.text_input("Search Keyword (Optional)")

    source_name_map = {name: key for key, (name, _) in rss_sources.items()}
    selected_sources = list(source_name_map.keys())

    def filter_entry(entry):
        pub_date = entry.get("published_date", "")
        if not pub_date:
            return False
        try:
            date_obj = datetime.datetime.strptime(pub_date, "%Y-%m-%d").date()
        except:
            return False
        if not (start_date <= date_obj <= end_date):
            return False
        if keyword:
            text = (entry.get("title", "") + entry.get("description", "")).lower()
            if keyword.lower() not in text:
                return False
        return True

    all_entries = []
    for src in selected_sources:
        key = source_name_map[src]
        name, url = rss_sources[key]
        entries = fetch_rss_entries(url, name)
        filtered = [e for e in entries if filter_entry(e)]
        all_entries.extend(filtered)

    if all_entries:
        if not mobile_mode:
            # Desktop layout sorting/filter UI (side-by-side)
            left_col, spacer_col, right_col = st.columns([3, 4, 3])
            with left_col:
                st.markdown('<h3 style="margin-top: 1.5rem;">Available News Entries</h3>', unsafe_allow_html=True)
            with right_col:
                sel_col1, sel_col2 = st.columns([1, 1])
                with sel_col1:
                    sort_by_title = st.selectbox("", ["A - Z", "Z - A"], index=0, key="sort_title")
                with sel_col2:
                    source_names = [name for _, (name, _) in rss_sources.items()]
                    source_filter = st.selectbox("", ["All Sources"] + source_names, index=0, key="sort_source")
        else:
            # Mobile layout sorting/filter UI side-by-side horizontally
            st.markdown('<h3 style="margin-top: 1.5rem;">Available News Entries</h3>', unsafe_allow_html=True)
            sort_col, source_col = st.columns(2)
            with sort_col:
                sort_by_title = st.selectbox("Sort By Title", ["A - Z", "Z - A"], index=0, key="sort_title")
            with source_col:
                source_names = [name for _, (name, _) in rss_sources.items()]
                source_filter = st.selectbox("Filter By Source", ["All Sources"] + source_names, index=0, key="sort_source")

        # Apply sorting/filtering
        reverse_alpha = True if sort_by_title == "Z - A" else False
        all_entries.sort(key=lambda x: x.get("title", "").lower(), reverse=reverse_alpha)

        if source_filter != "All Sources":
            all_entries = [entry for entry in all_entries if entry.get("source") == source_filter]

        st.markdown("### ")

        if not mobile_mode:
            # Desktop layout table
            header_cols = st.columns([2.5, 3.5, 1.5, 1.5, 0.7, 0.7])
            header_cols[0].markdown('<div style="text-align: center; font-weight: bold;">Title</div>', unsafe_allow_html=True)
            header_cols[1].markdown('<div style="text-align: center; font-weight: bold;">Description</div>', unsafe_allow_html=True)
            header_cols[2].markdown('<div style="text-align: center; font-weight: bold;">Published Date</div>', unsafe_allow_html=True)
            header_cols[3].markdown('<div style="text-align: center; font-weight: bold;">Source</div>', unsafe_allow_html=True)
            header_cols[4].markdown('<div style="text-align: center; font-weight: bold;">Accept</div>', unsafe_allow_html=True)
            header_cols[5].markdown('<div style="text-align: center; font-weight: bold;">Reject</div>', unsafe_allow_html=True)
            st.markdown("---")

            for idx, entry in enumerate(all_entries):
                cols = st.columns([2.5, 3.5, 1.5, 1.5, 0.7, 0.7])
                with cols[0]:
                    st.markdown(f"[{entry['title']}]({entry['link']})", unsafe_allow_html=True)
                with cols[1]:
                    desc = entry.get("description", "") or "No description"
                    short_desc = desc[:200] + "..." if len(desc) > 200 else desc
                    st.markdown(short_desc)
                with cols[2]:
                    st.markdown(f"<div class='date-cell'>{entry.get('published_date', 'N/A')}</div>", unsafe_allow_html=True)
                with cols[3]:
                    st.markdown(f"<div class='date-cell'>{entry.get('source', 'N/A')}</div>", unsafe_allow_html=True)
                with cols[4]:
                    sub_col = st.columns([1, 2, 1])
                    clicked_accept = sub_col[1].button("✅", key=f"accept_{idx}")
                    if clicked_accept:
                        save_news_status(entry, "Accepted")
                        st.success("Accepted")
                with cols[5]:
                    sub_col = st.columns([1, 2, 1])
                    clicked_reject = sub_col[1].button("❌", key=f"reject_{idx}")
                    if clicked_reject:
                        save_news_status(entry, "Rejected")
                        st.error("Rejected")
                st.markdown("---")

        else:
            # Mobile layout stacked entries with horizontal Accept/Reject buttons
            for idx, entry in enumerate(all_entries):
                st.markdown(f"**Title:** [{entry['title']}]({entry['link']})")
                desc = entry.get("description", "") or "No description"
                short_desc = desc[:200] + "..." if len(desc) > 200 else desc
                st.markdown(f"**Description:** {short_desc}")
                st.markdown(f"**Published Date:** {entry.get('published_date', 'N/A')}")
                st.markdown(f"**Source:** {entry.get('source', 'N/A')}")

                # Accept and Reject buttons side by side
                col_accept, col_reject = st.columns(2)
                with col_accept:
                    clicked_accept = st.button("✅ Accept", key=f"accept_mobile_{idx}")
                    if clicked_accept:
                        save_news_status(entry, "Accepted")
                        st.success("Accepted")
                with col_reject:
                    clicked_reject = st.button("❌ Reject", key=f"reject_mobile_{idx}")
                    if clicked_reject:
                        save_news_status(entry, "Rejected")
                        st.error("Rejected")

                st.markdown("---")

    else:
        st.warning("No news entries found for the current filters.")

if __name__ == "__main__":
    run()
