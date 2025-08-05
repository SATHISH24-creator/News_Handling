from pymongo import MongoClient
import datetime
import streamlit as st

def get_mongo_collection():
    mongo_uri = st.secrets["mongodb"]["uri"]
    client = MongoClient(mongo_uri)
    db = client["Main_DB"]
    return db["Neural_News"]

def save_news_status(entry, status):
    collection = get_mongo_collection()

    data = {
        "title": entry.get("title", ""),
        "description": entry.get("description", ""),
        "published_date": entry.get("published_date", "Not specified"),
        "source": entry.get("source", "Unknown"),
        "status": status,
        "link": entry.get("link", ""),
        "saved_at": datetime.datetime.utcnow()
    }

    # Avoid duplicates by title + link
    if not collection.find_one({"title": data["title"], "link": data["link"]}):
        collection.insert_one(data)
    else:
        # Update the status if already exists
        collection.update_one(
            {"title": data["title"], "link": data["link"]},
            {"$set": {"status": status, "saved_at": datetime.datetime.utcnow()}}
        )
