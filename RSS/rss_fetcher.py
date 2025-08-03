import feedparser
import time
from html.parser import HTMLParser

class HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.fed = []

    def handle_data(self, d):
        self.fed.append(d)

    def get_data(self):
        return ''.join(self.fed)

def strip_tags(html):
    s = HTMLStripper()
    s.feed(html)
    return s.get_data()

def fetch_rss_entries(url, source_name):
    """Fetch entries from RSS feed URL, normalize published_date to YYYY-MM-DD format."""
    feed = feedparser.parse(url)
    entries = []

    for entry in feed.entries:
        image = ""
        if "media_content" in entry:
            image = entry.media_content[0].get("url", "")
        elif "media_thumbnail" in entry:
            image = entry.media_thumbnail[0].get("url", "")
        elif "image" in entry:
            image = entry.get("image", "")

        pub_parsed = entry.get("published_parsed") or entry.get("updated_parsed")

        published_date = ""
        if pub_parsed:
            published_date = time.strftime("%Y-%m-%d", pub_parsed)

        summary = entry.get("summary", "")
        clean_description = strip_tags(summary)

        entries.append({
            "title": entry.get("title", ""),
            "description": clean_description,
            "link": entry.get("link", ""),
            "published_date": published_date,
            "source": source_name,
            "selected": False,
            "analyzed": False,
            "image": image
        })

    return entries
