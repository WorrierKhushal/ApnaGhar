import os
import pickle
import numpy as np
import pandas as pd
from recommendation_service.config import MODEL_DIR

class CollaborativeRecommender:
    def __init__(self):
        self.item_similarity = None
        self.interaction_matrix = None
        self.metadata = None
        self.load_models()

    def load_models(self):
        cf_pkl = os.path.join(MODEL_DIR, "item_similarity.pkl")
        matrix_pkl = os.path.join(MODEL_DIR, "interaction_matrix.pkl")
        metadata_pkl = os.path.join(MODEL_DIR, "listing_metadata.pkl")

        if os.path.exists(cf_pkl) and os.path.exists(matrix_pkl) and os.path.exists(metadata_pkl):
            try:
                with open(cf_pkl, "rb") as f:
                    self.item_similarity = pickle.load(f)
                with open(matrix_pkl, "rb") as f:
                    self.interaction_matrix = pickle.load(f)
                with open(metadata_pkl, "rb") as f:
                    self.metadata = pickle.load(f)
                print("Collaborative filtering models loaded successfully in recommender service.")
            except Exception as e:
                print(f"Error loading collaborative models: {e}")
        else:
            print("Collaborative model pickle files not found. Please train the model first.")

    def get_collaborative_recommendations(self, user_id: str, top_n: int = 6):
        """
        Predicts item preference for a given user using Item-Item Collaborative Filtering:
        r_hat(u, i) = sum(Sim(i, j) * r(u, j)) / sum(Sim(i, j))
        """
        # Reload models if not loaded yet
        if self.item_similarity is None or self.interaction_matrix is None or self.metadata is None:
            self.load_models()
            if self.item_similarity is None or self.interaction_matrix is None or self.metadata is None:
                return []

        # Check if user exists in the interaction matrix
        if user_id not in self.interaction_matrix.index:
            print(f"User {user_id} not found in interaction matrix (Cold Start).")
            return []

        # Get the list of listing IDs from metadata (which aligns with columns of interaction matrix and similarity matrix)
        listings_df = self.metadata.get("listings_df")
        if listings_df is None or listings_df.empty:
            return []
        
        listing_ids = listings_df["listing_id"].tolist()
        id_to_idx = self.metadata.get("id_to_idx", {})

        # User's interaction vector (ratings / weights for each listing)
        user_vector = self.interaction_matrix.loc[user_id].values  # shape: (n_listings,)
        
        # Listings the user has already interacted with
        interacted_indices = np.where(user_vector > 0)[0]
        
        if len(interacted_indices) == 0:
            return []

        recommendations = []

        # Predict scores for all listings
        for i, listing_id in enumerate(listing_ids):
            # Skip items user has already interacted with to recommend new things
            if i in interacted_indices:
                continue

            # Similarities between listing i and all items user has interacted with
            similarities = self.item_similarity[i, interacted_indices]
            
            # User's weights for those interacted items
            weights = user_vector[interacted_indices]
            
            # Weighted average calculation
            sim_sum = np.sum(similarities)
            if sim_sum > 0:
                predicted_score = np.sum(similarities * weights) / sim_sum
            else:
                predicted_score = 0.0

            if predicted_score > 0:
                recommendations.append({
                    "listing_id": listing_id,
                    "score": float(predicted_score)
                })

        # Sort by predicted score descending
        recommendations = sorted(recommendations, key=lambda x: x["score"], reverse=True)
        return recommendations[:top_n]
