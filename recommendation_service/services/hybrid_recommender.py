import os
import pickle
import numpy as np
import pandas as pd
from pymongo import MongoClient
from recommendation_service.config import MODEL_DIR, MONGO_URI
from recommendation_service.services.content_recommender import ContentRecommender
from recommendation_service.services.collaborative_recommender import CollaborativeRecommender

class HybridRecommender:
    def __init__(self):
        self.content_recommender = ContentRecommender()
        self.collaborative_recommender = CollaborativeRecommender()
        self.db_client = MongoClient(MONGO_URI)
        self.db = self.db_client.get_database()

    def get_hybrid_recommendations(self, user_id: str = None, top_n: int = 6, alpha: float = 0.5):
        """
        Combines Content-Based Similarity scores and Collaborative Filtering predictions:
        Score_Hybrid(u, i) = alpha * Score_CB(u, i) + (1 - alpha) * Score_CF(u, i)
        
        Handles Cold-Start:
        - For new users: returns popular listings fallback (optionally filtered by their recent search queries)
        - For new listings: content similarity acts as fallback within hybrid scoring
        """
        # 1. Load/Reload Models
        self.content_recommender.load_models()
        self.collaborative_recommender.load_models()

        metadata = self.content_recommender.metadata
        cb_matrix = self.content_recommender.similarity_matrix
        interaction_matrix = self.collaborative_recommender.interaction_matrix
        cf_similarity = self.collaborative_recommender.item_similarity

        if metadata is None or cb_matrix is None or interaction_matrix is None or cf_similarity is None:
            return self._get_fallback_popular_listings(user_id, top_n)

        # Get list of all listing IDs
        listings_df = metadata.get("listings_df")
        if listings_df is None or listings_df.empty:
            return []
        
        listing_ids = listings_df["listing_id"].tolist()
        id_to_idx = metadata.get("id_to_idx", {})

        # Check if user is a cold-start user (no interactions or unknown ID)
        if not user_id or user_id not in interaction_matrix.index:
            print(f"Cold start detected for user {user_id}. Generating fallback popularity recommendations.")
            return self._get_fallback_popular_listings(user_id, top_n)

        user_vector = interaction_matrix.loc[user_id].values  # shape: (n_listings,)
        interacted_indices = np.where(user_vector > 0)[0]

        # If user has no interactions recorded, they are cold start
        if len(interacted_indices) == 0:
            print(f"Cold start detected: User {user_id} has empty interaction vector. Using fallback.")
            return self._get_fallback_popular_listings(user_id, top_n)

        # 2. Calculate Content-Based Scores for the User
        # CB Score for item i = average similarity between i and all items user interacted with,
        # weighted by interaction weights: sum(CB_Sim(i, j) * weight(u, j)) / sum(weight(u, j))
        cb_scores = []
        user_weights = user_vector[interacted_indices]
        sum_weights = np.sum(user_weights)

        for i in range(len(listing_ids)):
            item_similarities = cb_matrix[i, interacted_indices]
            if sum_weights > 0:
                cb_score = np.sum(item_similarities * user_weights) / sum_weights
            else:
                cb_score = 0.0
            cb_scores.append(cb_score)
            
        cb_scores = np.array(cb_scores)

        # 3. Calculate Collaborative Filtering Scores for the User
        cf_scores = []
        for i in range(len(listing_ids)):
            similarities = cf_similarity[i, interacted_indices]
            sim_sum = np.sum(similarities)
            if sim_sum > 0:
                cf_score = np.sum(similarities * user_weights) / sim_sum
            else:
                cf_score = 0.0
            cf_scores.append(cf_score)
            
        cf_scores = np.array(cf_scores)

        # 4. Normalize Scores (Min-Max Scaling to [0, 1] range)
        def min_max_normalize(scores):
            s_min = np.min(scores)
            s_max = np.max(scores)
            diff = s_max - s_min
            if diff > 0:
                return (scores - s_min) / diff
            return np.zeros_like(scores)

        cb_norm = min_max_normalize(cb_scores)
        cf_norm = min_max_normalize(cf_scores)

        # 5. Hybrid Blending & Filter Already Visited Bookings/Reviews (optional, but keep it high rank for new items)
        hybrid_scores = alpha * cb_norm + (1.0 - alpha) * cf_norm
        
        recommendations = []
        for i, listing_id in enumerate(listing_ids):
            # Skip stays where user has high commitment interactions (e.g. booked already, score weight >= 5.0)
            # but allow recommending stays user has only viewed or wishlisted
            if user_vector[i] >= 5.0:
                continue
                
            recommendations.append({
                "listing_id": listing_id,
                "score": float(hybrid_scores[i]),
                "cb_score": float(cb_norm[i]),
                "cf_score": float(cf_norm[i])
            })

        # Sort by hybrid score descending
        recommendations = sorted(recommendations, key=lambda x: x["score"], reverse=True)
        return recommendations[:top_n]

    def _get_fallback_popular_listings(self, user_id: str = None, top_n: int = 6):
        """
        Cold Start Resolver:
        1. Checks user search history to find their most searched location query (e.g. Jaipur, Manali).
        2. Pulls stays from that location, ordered by safety indicators and pricing/demand.
        3. If no search history or location matches, falls back to globally popular listings (safety index + demand).
        """
        matched_city = None
        
        # Try to pull recent search terms from database
        if user_id:
            try:
                # Find latest searches
                recent_searches = list(self.db.searchhistories.find({"user": user_id}).sort("timestamp", -1).limit(5))
                if recent_searches:
                    # Look for keywords corresponding to seeded cities
                    cities = ["jaipur", "manali", "alleppey", "kerala", "rajasthan"]
                    for search in recent_searches:
                        query = search.get("query", "").lower()
                        for c in cities:
                            if c in query:
                                matched_city = c
                                if matched_city == "kerala":
                                    matched_city = "alleppey"
                                if matched_city == "rajasthan":
                                    matched_city = "jaipur"
                                break
                        if matched_city:
                            break
            except Exception as e:
                print(f"Error querying search history for cold start: {e}")

        # Query listings
        query = {}
        if matched_city:
            print(f"Filtering fallback popular stays by searched city: {matched_city}")
            # Case insensitive match for city
            query["location.city"] = {"$regex": matched_city, "$options": "i"}

        try:
            # Load listings, sort by safetyIndex (descending) and demand indicator ("High" first)
            # Note: We can assign sorting points in Python
            cursor = self.db.listings.find(query)
            listings = []
            for doc in cursor:
                safety_score = doc.get("safetyIndicators", {}).get("safetyIndex", 8.5)
                demand = doc.get("demandIndicator", "Medium")
                demand_score = 3.0 if demand == "High" else (2.0 if demand == "Medium" else 1.0)
                
                # Composite popularity index
                pop_index = safety_score + demand_score
                
                listings.append({
                    "listing_id": str(doc["_id"]),
                    "score": pop_index
                })
            
            # If city query yielded nothing, retry without city filter
            if not listings and matched_city:
                print("No stays found for searched city fallback. Retrying with global stays.")
                return self._get_fallback_popular_listings(user_id=None, top_n=top_n)

            # Sort by composite score
            listings = sorted(listings, key=lambda x: x["score"], reverse=True)
            return listings[:top_n]
            
        except Exception as e:
            print(f"Error executing fallback popular stays query: {e}")
            return []
            
    def close(self):
        self.db_client.close()
