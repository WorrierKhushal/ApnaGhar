import os
import pickle
from recommendation_service.config import MODEL_DIR
from recommendation_service.pipeline.feature_engineering import (
    get_db_client,
    fetch_listings_data,
    build_content_similarity,
    fetch_interactions_data,
    build_collaborative_similarity
)

def train_pipeline():
    print("Connecting to MongoDB and loading data...")
    client = get_db_client()
    db = client.get_database()
    
    # 1. Train Content-Based Model
    print("Running Content-Based Feature Engineering...")
    df_listings = fetch_listings_data(db)
    if df_listings.empty:
        print("No listings found in the database. Cannot train models.")
        client.close()
        return False
        
    print(f"Loaded {len(df_listings)} listings.")
    vectorizer, similarity_matrix = build_content_similarity(df_listings)
    
    # Save Content-Based artifacts
    content_pkl_path = os.path.join(MODEL_DIR, "content_similarity.pkl")
    metadata_pkl_path = os.path.join(MODEL_DIR, "listing_metadata.pkl")
    
    id_to_idx = {row["listing_id"]: idx for idx, row in df_listings.iterrows()}
    idx_to_id = {idx: row["listing_id"] for idx, row in df_listings.iterrows()}
    
    metadata = {
        "listings_df": df_listings,
        "id_to_idx": id_to_idx,
        "idx_to_id": idx_to_id
    }
    
    with open(content_pkl_path, "wb") as f:
        pickle.dump(similarity_matrix, f)
        
    with open(metadata_pkl_path, "wb") as f:
        pickle.dump(metadata, f)
    print("Content-based similarity model trained and serialized successfully!")
        
    # 2. Train Collaborative Filtering Model
    print("Running Collaborative Filtering Feature Engineering...")
    df_interactions = fetch_interactions_data(db)
    print(f"Loaded {len(df_interactions)} unique user-listing interactions.")
    
    interaction_matrix, item_sim = build_collaborative_similarity(df_interactions, df_listings)
    
    # Save Collaborative Filtering artifacts
    cf_pkl_path = os.path.join(MODEL_DIR, "item_similarity.pkl")
    matrix_pkl_path = os.path.join(MODEL_DIR, "interaction_matrix.pkl")
    
    with open(cf_pkl_path, "wb") as f:
        pickle.dump(item_sim, f)
        
    with open(matrix_pkl_path, "wb") as f:
        pickle.dump(interaction_matrix, f)
        
    print("Collaborative filtering similarity model trained and serialized successfully!")
    client.close()
    return True

if __name__ == "__main__":
    train_pipeline()
