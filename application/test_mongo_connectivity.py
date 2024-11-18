# test_mongo_connection.py
from pymongo import MongoClient

try:
    client = MongoClient("mongodb://Admin:adminPassword@mongo:27017/discordBotDB?authSource=admin")
    db = client.get_database("discordBotDB")
    print("Successfully connected to MongoDB. Collections in discordBotDB:", db.list_collection_names())
except Exception as e:
    print("Failed to connect to MongoDB:", e)