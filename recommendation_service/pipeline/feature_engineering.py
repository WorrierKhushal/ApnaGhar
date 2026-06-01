import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from recommendation_service.config import MONGO_URI

def get_db_client():
    return MongoClient(MONGO_URI)

def fetch_listings_data(db):
    cursor = db.listings.find({}, {
        "_id": 1,
        "title": 1,
        "description": 1,
        "location.city": 1,
        "location.state": 1,
        "amenities": 1,
        "indianFilters": 1,
        "safetyIndicators": 1,
        "demandIndicator": 1,
        "bestTimeToBook": 1
    })
    
    listings = []
    for doc in cursor:
        listing_id = str(doc["_id"])
        
        # Build features text bag
        title = doc.get("title", "")
        description = doc.get("description", "")
        loc = doc.get("location", {})
        city = loc.get("city", "")
        state = loc.get("state", "")
        best_time = doc.get("bestTimeToBook", "")
        amenities = " ".join(doc.get("amenities", []))
        
        # Indian Filters text enrichment
        ind_filters = doc.get("indianFilters", {})
        filters_tags = []
        if ind_filters.get("nearRailway"):
            filters_tags.append("near railway train station junction transit")
        if ind_filters.get("nearMetro"):
            filters_tags.append("near metro subway underground transit")
        if ind_filters.get("nearAirport"):
            filters_tags.append("near airport flight terminal transit")
        if ind_filters.get("nearTemple"):
            filters_tags.append("near temple mandir spiritual ghat ashram ganges")
        if ind_filters.get("nearTouristPlace"):
            filters_tags.append("near tourist fort palace monument sight seeing sightseeing")
        if ind_filters.get("vegFoodNearby"):
            filters_tags.append("pure veg food vegetarian kitchen local dhaba sattvik")
        if ind_filters.get("jainFoodNearby"):
            filters_tags.append("jain food jain kitchen")
            
        # Category deduction
        category_tags = []
        t_low = title.lower()
        d_low = description.lower()
        if "haveli" in t_low or "haveli" in d_low or "palace" in t_low or "palace" in d_low:
            category_tags.append("heritage haveli palace royal fort stay")
        elif "homestay" in t_low or "homestay" in d_low or "ancestral" in t_low or "ancestral" in d_low:
            category_tags.append("ancestral homestay local native authentic experience")
        elif "farm" in t_low or "farm" in d_low or "estate" in t_low or "estate" in d_low:
            category_tags.append("farm stay organic rural nature green countryside")
        elif "villa" in t_low or "villa" in d_low or "apartment" in t_low or "apartment" in d_low:
            category_tags.append("modern villa apartment flat luxury room")
            
        filters_text = " ".join(filters_tags)
        category_text = " ".join(category_tags)
        
        metadata_text = f"{title} {description} {city} {state} {best_time} {amenities} {filters_text} {category_text}"
        
        listings.append({
            "listing_id": listing_id,
            "title": title,
            "city": city,
            "state": state,
            "metadata_text": metadata_text,
            "safety_index": doc.get("safetyIndicators", {}).get("safetyIndex", 8.5),
            "demand": doc.get("demandIndicator", "Medium")
        })
        
    return pd.DataFrame(listings)

def build_content_similarity(df):
    if df.empty:
        return None, None
        
    vectorizer = TfidfVectorizer(
        stop_words="english", 
        sublinear_tf=True, 
        ngram_range=(1, 2)
    )
    
    # Compute TF-IDF matrices
    tfidf_matrix = vectorizer.fit_transform(df["metadata_text"])
    
    # Compute Cosine Similarity
    similarity_matrix = cosine_similarity(tfidf_matrix)
    
    return vectorizer, similarity_matrix

def fetch_interactions_data(db):
    cursor = db.interactions.find({}, {
        "user": 1,
        "listing": 1,
        "weight": 1
    })
    
    interactions = []
    for doc in cursor:
        interactions.append({
            "user": str(doc["user"]),
            "listing": str(doc["listing"]),
            "weight": float(doc["weight"])
        })
        
    if not interactions:
        return pd.DataFrame(columns=["user", "listing", "weight"])
        
    df = pd.DataFrame(interactions)
    # Aggregate weights for duplicate user-listing pairs (e.g. view + wishlist)
    df_agg = df.groupby(["user", "listing"], as_index=False)["weight"].sum()
    return df_agg

def build_collaborative_similarity(df_interactions, df_listings):
    if df_listings.empty:
        return None, None
        
    all_listing_ids = df_listings["listing_id"].tolist()
    
    if df_interactions.empty:
        n_listings = len(all_listing_ids)
        item_sim = np.zeros((n_listings, n_listings))
        interaction_matrix = pd.DataFrame(columns=all_listing_ids)
        return interaction_matrix, item_sim
        
    # Pivot the interaction matrix: rows = users, columns = listings
    interaction_matrix = df_interactions.pivot(index="user", columns="listing", values="weight").fillna(0.0)
    
    # Ensure all listings are present as columns in the matrix in the exact order of df_listings
    for lid in all_listing_ids:
        if lid not in interaction_matrix.columns:
            interaction_matrix[lid] = 0.0
            
    # Reorder columns to match the list of all listings exactly
    interaction_matrix = interaction_matrix[all_listing_ids]
    
    # Calculate item-item cosine similarity over listing columns
    item_vectors = interaction_matrix.T.values  # shape: (n_listings, n_users)
    
    # Compute similarity and fill NaNs with 0.0 (occurs if an item has all zero interaction vectors)
    with np.errstate(divide='ignore', invalid='ignore'):
        item_sim = cosine_similarity(item_vectors)
        item_sim = np.nan_to_num(item_sim)
        
    return interaction_matrix, item_sim
