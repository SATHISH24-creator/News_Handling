from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import requests
from newspaper import Article
from pymongo import MongoClient
import datetime
import feedparser
import time
from html.parser import HTMLParser
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Neural News Hub API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class RSSEntry(BaseModel):
    title: str
    description: str
    link: str
    published_date: str
    source: str
    image: str = ""

class NewsStatus(BaseModel):
    title: str
    description: str
    published_date: str
    source: str
    link: str
    status: str

class FilterParams(BaseModel):
    start_date: str
    end_date: str
    keyword: Optional[str] = None
    status_filter: str = "All"
    source_filter: str = "All Sources"

# RSS Sources
rss_sources = {
    "1": ("DeepMind Blog", "https://rss.app/feeds/dISWeyZM2Tzfmh7n.xml"),
    "2": ("NVIDIA Developer - Generative AI", "https://rss.app/feeds/sh5T3ziuw18ppMnJ.xml"),
    "3": ("OpenAI News", "https://rss.app/feeds/88lTJ2E61JPFhtfy.xml"),
    "4": ("AWS Machine Learning", "https://rss.app/feeds/IvbT7TcwbDQXkpio.xml"),
    "5": ("Perplexity AI", "https://rss.app/feeds/nZ4JF5xejzLVJXkA.xml"),
    "6": ("NVIDIA Robotics", "https://rss.app/feeds/fgok8MDwu6ZJCOl7.xml"),
    "7": ("Anthropic", "https://rss.app/feeds/R87xeBq4tXiHLS3s.xml"),
    "8": ("Microsoft", "https://rss.app/feeds/bQF9FLInBGQsYBi5.xml"),
    "9": ("Meta AI Blog", "https://rss.app/feeds/9QDXU7Tl5VxHCNtv.xml"),
    "10": ("Hugging Face", "https://rss.app/feeds/IkUVIFijmf7JEj9f.xml"),
    "11": ("Boston Dynamics", "https://rss.app/feeds/aDP50odVFp6PJLj8.xml"),
    "12": ("News MIT", "https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml")
}

# HTML Stripper for RSS content
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

# MongoDB utilities
def get_mongo_collection():
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        raise HTTPException(status_code=500, detail="MongoDB URI not configured")
    client = MongoClient(mongo_uri)
    db = client["Main_DB"]
    return db["Neural_News"]

# RSS fetching function
def fetch_rss_entries(url: str, source_name: str) -> List[RSSEntry]:
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

        entries.append(RSSEntry(
            title=entry.get("title", ""),
            description=clean_description,
            link=entry.get("link", ""),
            published_date=published_date,
            source=source_name,
            image=image
        ))

    return entries

# Description extraction function
def extract_description_from_url(url: str) -> str:
    """Extract description from article URL using newspaper3k and OpenRouter LLM API."""
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
                return desc
    except Exception as e:
        print(f"Local extraction failed for {url}: {e}")

    # Fallback: OpenRouter LLM API
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key:
        return "No API key configured for description generation."

    prompt = (
        f"Extract a concise, high-quality summary of at least 30 words from the full article at this URL:\n{url}\n\n"
        "Exclude any dates, author names, section titles, or repeated phrases. "
        "Focus only on the main content and key ideas of the article."
    )
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
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

        return description
    except Exception as e:
        print(f"Error calling OpenRouter LLM API: {e}")
        return "Description unavailable"

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Neural News Hub API"}

@app.get("/api/rss-sources")
async def get_rss_sources():
    """Get available RSS sources"""
    return {"sources": rss_sources}

@app.post("/api/fetch-rss")
async def fetch_rss_feeds(params: FilterParams):
    """Fetch RSS feeds with filtering"""
    all_entries = []
    
    for key, (name, url) in rss_sources.items():
        entries = fetch_rss_entries(url, name)
        
        # Filter entries based on date range and keyword
        filtered_entries = []
        for entry in entries:
            if not entry.published_date:
                continue
                
            try:
                date_obj = datetime.datetime.strptime(entry.published_date, "%Y-%m-%d").date()
                start_date = datetime.datetime.strptime(params.start_date, "%Y-%m-%d").date()
                end_date = datetime.datetime.strptime(params.end_date, "%Y-%m-%d").date()
                
                if not (start_date <= date_obj <= end_date):
                    continue
                    
                if params.keyword:
                    text = (entry.title + entry.description).lower()
                    if params.keyword.lower() not in text:
                        continue
                        
                filtered_entries.append(entry)
            except:
                continue
                
        all_entries.extend(filtered_entries)
    
    return {"entries": all_entries}

@app.post("/api/extract-description")
async def extract_description(request: dict):
    """Extract description from article URL"""
    url = request.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    description = extract_description_from_url(url)
    return {"description": description}

@app.post("/api/save-news-status")
async def save_news_status(request: dict):
    """Save or update news status in MongoDB"""
    entry_data = request.get("entry")
    status = request.get("status")
    
    if not entry_data or not status:
        raise HTTPException(status_code=400, detail="Entry and status are required")
    
    collection = get_mongo_collection()
    
    data = {
        "title": entry_data.get("title", ""),
        "description": entry_data.get("description", ""),
        "published_date": entry_data.get("published_date", ""),
        "source": entry_data.get("source", ""),
        "status": status,
        "link": entry_data.get("link", ""),
        "saved_at": datetime.datetime.utcnow()
    }
    
    # Avoid duplicates by title + link
    existing = collection.find_one({"title": data["title"], "link": data["link"]})
    if not existing:
        collection.insert_one(data)
    else:
        # Update the status if already exists
        collection.update_one(
            {"title": data["title"], "link": data["link"]},
            {"$set": {"status": status, "saved_at": datetime.datetime.utcnow()}}
        )
    
    return {"message": f"News status saved as {status}"}

@app.get("/api/filtered-news")
async def get_filtered_news(
    status_filter: str = "All",
    start_date: str = None,
    end_date: str = None,
    keyword_filter: str = ""
):
    """Get filtered news from MongoDB"""
    try:
        collection = get_mongo_collection()
        # Build query
        query = {}
        if start_date and end_date:
            try:
                start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
                end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d") + datetime.timedelta(days=1)
            except Exception as e:
                print(f"Date parsing error: {e}")
                raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
            query["saved_at"] = {
                "$gte": start_dt,
                "$lte": end_dt
            }
        if status_filter != "All":
            query["status"] = status_filter
        if keyword_filter and keyword_filter.strip():
            query["$or"] = [
                {"title": {"$regex": keyword_filter, "$options": "i"}},
                {"description": {"$regex": keyword_filter, "$options": "i"}}
            ]
        print(f"Filtered news query: {query}")
        entries = list(collection.find(query).sort("saved_at", -1))
        # Convert ObjectId to string for JSON serialization
        for entry in entries:
            entry["_id"] = str(entry["_id"])
            if "saved_at" in entry:
                entry["saved_at"] = entry["saved_at"].isoformat()
        return {"entries": entries}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in /api/filtered-news: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
