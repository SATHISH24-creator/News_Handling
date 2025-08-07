import streamlit as st
import datetime
from RSS.rss_sources import rss_sources
from RSS.rss_fetcher import fetch_rss_entries
from Database.db_utils import save_news_status
import requests
from newspaper import Article

# Cache descriptions to avoid repeated calls
description_cache = {}

def extract_description_from_url(url):
    if url in description_cache:
        return description_cache[url]

    try:
        article = Article(url)
        article.download()
        article.parse()
        article.nlp()

        title_text = article.title.strip().lower()

        candidates = [
            getattr(article, 'summary', '').strip(),
            article.meta_description if hasattr(article, 'meta_description') else '',
            article.text.strip()
        ]

        def is_poor_desc(text):
            if len(text) < 100:
                return True
            lower = text.lower()
            boilerplate_phrases = [
                "published", "community article", "how your", "advertisement", "cookie policy"
            ]
            return any(phrase in lower for phrase in boilerplate_phrases)

        for candidate in candidates:
            candidate = " ".join(candidate.split())  # normalize spaces
            if not candidate:
                continue

            if title_text in candidate.lower() or candidate.lower() in title_text:
                continue

            if not is_poor_desc(candidate):
                desc = candidate[:500] + "..." if len(candidate) > 500 else candidate
                description_cache[url] = desc
                return desc
    except Exception as e:
        print(f"Local extraction failed for {url}: {e}")

    # Fallback: OpenRouter LLM API
    OPENROUTER_API_KEY = st.secrets.get("OPENROUTER_API_KEY", None)
    if not OPENROUTER_API_KEY:
        return "No API key configured for description generation."

    prompt = (
        f"Extract a concise, high-quality summary of at least 30 words from the full article at this URL:\n{url}\n\n"
        "Exclude any dates, author names, section titles, or repeated phrases. "
        "Focus only on the main content and key ideas of the article."
    )
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    json_data = {
        "model": "perplexity/sonar",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
        "temperature": 0.0
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=json_data,
            timeout=20
        )
        response.raise_for_status()
        data = response.json()
        description = data["choices"][0]["message"]["content"].strip()
        description = " ".join(description.split())

        if len(description.split()) < 30:
            description += " [Summary may be brief due to article length.]"

        if len(description) > 500:
            description = description[:500] + "..."

        description_cache[url] = description
        return description
    except Exception as e:
        print(f"Error calling OpenRouter LLM API: {e}")
        return "Description unavailable"

def run():
    st.title("📰 News Arena")

    st.markdown("""
        <style>
        .block-container { padding-top: 1rem; }
        div[data-testid="column"] { align-items: start !important; padding-left: 0.3rem; }
        .date-cell { text-align: center; width: 100%; display: block; }
        .stButton > button { padding: 0.2rem 0.5rem; font-size: 0.8rem; }
        [data-testid="stSelectbox"] > div > div { max-width: 150px !important; }
        </style>
    """, unsafe_allow_html=True)

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
            st.markdown('<h3 style="margin-top: 1.5rem;">Available News Entries</h3>', unsafe_allow_html=True)
            sort_col, source_col = st.columns(2)
            with sort_col:
                sort_by_title = st.selectbox("Sort By Title", ["A - Z", "Z - A"], index=0, key="sort_title")
            with source_col:
                source_names = [name for _, (name, _) in rss_sources.items()]
                source_filter = st.selectbox("Filter By Source", ["All Sources"] + source_names, index=0, key="sort_source")

        reverse_alpha = True if sort_by_title == "Z - A" else False
        all_entries.sort(key=lambda x: x.get("title", "").lower(), reverse=reverse_alpha)

        if source_filter != "All Sources":
            all_entries = [entry for entry in all_entries if entry.get("source") == source_filter]

        st.markdown("### ")

        if not mobile_mode:
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

                desc = extract_description_from_url(entry['link'])
                if not desc or desc.lower() in ["description unavailable", "no api key configured for description generation."]:
                    desc = entry.get('description', '').strip()

                short_desc = desc[:200] + "..." if len(desc) > 200 else desc
                with cols[1]:
                    st.markdown(short_desc)
                with cols[2]:
                    st.markdown(f"<div class='date-cell'>{entry.get('published_date', 'N/A')}</div>", unsafe_allow_html=True)
                with cols[3]:
                    st.markdown(f"<div class='date-cell'>{entry.get('source', 'N/A')}</div>", unsafe_allow_html=True)
                with cols[4]:
                    sub_col = st.columns([1, 2, 1])
                    if sub_col[1].button("✅", key=f"accept_{idx}"):
                        save_news_status(entry, "Accepted")
                        st.success("Accepted")
                with cols[5]:
                    sub_col = st.columns([1, 2, 1])
                    if sub_col[1].button("❌", key=f"reject_{idx}"):
                        save_news_status(entry, "Rejected")
                        st.error("Rejected")
                st.markdown("---")

        else:
            for idx, entry in enumerate(all_entries):
                st.markdown(f"**Title:** [{entry['title']}]({entry['link']})")

                desc = extract_description_from_url(entry['link'])
                if not desc or desc.lower() in ["description unavailable", "no api key configured for description generation."]:
                    desc = entry.get('description', '').strip()

                short_desc = desc[:200] + "..." if len(desc) > 200 else desc
                st.markdown(f"**Description:** {short_desc}")
                st.markdown(f"**Published Date:** {entry.get('published_date', 'N/A')}")
                st.markdown(f"**Source:** {entry.get('source', 'N/A')}")

                col_accept, col_reject = st.columns(2)
                with col_accept:
                    if st.button("✅ Accept", key=f"accept_mobile_{idx}"):
                        save_news_status(entry, "Accepted")
                        st.success("Accepted")
                with col_reject:
                    if st.button("❌ Reject", key=f"reject_mobile_{idx}"):
                        save_news_status(entry, "Rejected")
                        st.error("Rejected")

                st.markdown("---")

    else:
        st.warning("No news entries found for the current filters.")

if __name__ == "__main__":
    run()
