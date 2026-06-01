import os
import pickle
import numpy as np
from recommendation_service.config import MODEL_DIR

class ContentRecommender:
    def __init__(self):
        self.similarity_matrix = None
        self.metadata = None
        self.load_models()

    def load_models(self):
        content_pkl = os.path.join(MODEL_DIR, "content_similarity.pkl")
        metadata_pkl = os.path.join(MODEL_DIR, "listing_metadata.pkl")

        if os.path.exists(content_pkl) and os.path.exists(metadata_pkl):
            try:
                with open(content_pkl, "rb") as f:
                    self.similarity_matrix = pickle.load(f)
                with open(metadata_pkl, "rb") as f:
                    self.metadata = pickle.load(f)
                print("Content models loaded successfully in recommender service.")
            except Exception as e:
                print(f"Error loading content models: {e}")
        else:
            print("Content model pickle files not found. Please train the model first.")

    def get_similar_listings(self, listing_id: str, top_n: int = 6):
        if self.similarity_matrix is None or self.metadata is None:
            self.load_models()
            if self.similarity_matrix is None or self.metadata is None:
                return []

        id_to_idx = self.metadata.get("id_to_idx", {})
        idx_to_id = self.metadata.get("idx_to_id", {})

        if listing_id not in id_to_idx:
            print(f"Listing ID {listing_id} not found in metadata indexes.")
            return []

        idx = id_to_idx[listing_id]
        
        sim_scores = self.similarity_matrix[idx]
        
        sorted_indices = np.argsort(sim_scores)[::-1]
        
        similar_items = []
        for i in sorted_indices:
            item_id = idx_to_id.get(i)
            if item_id == listing_id or item_id is None:
                continue
                
            similar_items.append({
                "listing_id": item_id,
                "score": float(sim_scores[i])
            })
            
            if len(similar_items) >= top_n:
                break
                
        return similar_items
