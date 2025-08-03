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

    document = {
        "title": entry["title"],
        "description": entry.get("description", ""),
        "published_date": entry.get("published_date", "Not specified"),
        "link": entry.get("link", ""),
        "image": entry.get("image", ""),  
        "status": status,
        "source": entry.get("source", ""),
        "timestamp": datetime.datetime.now()
    }

    existing = collection.find_one({"link": document["link"]})
    if existing:
        collection.update_one({"link": document["link"]}, {"$set": document})
    else:
        collection.insert_one(document)
