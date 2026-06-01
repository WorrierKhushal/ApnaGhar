from fastapi import FastAPI, BackgroundTasks, HTTPException
from recommendation_service.pipeline.trainer import train_pipeline
from recommendation_service.services.content_recommender import ContentRecommender
from recommendation_service.services.collaborative_recommender import CollaborativeRecommender
from recommendation_service.services.hybrid_recommender import HybridRecommender

app = FastAPI(title="AapnaGhar ML Recommendation Engine")

# Initialize recommendation model instances
content_recommender = ContentRecommender()
collaborative_recommender = CollaborativeRecommender()
hybrid_recommender = HybridRecommender()

def train_and_reload():
    success = train_pipeline()
    if success:
        content_recommender.load_models()
        collaborative_recommender.load_models()
        hybrid_recommender.content_recommender.load_models()
        hybrid_recommender.collaborative_recommender.load_models()
    return success

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": "AapnaGhar Recommendation Engine API",
        "loaded_models": {
            "content_similarity": content_recommender.similarity_matrix is not None,
            "collaborative_filtering": collaborative_recommender.item_similarity is not None
        }
    }

@app.post("/train")
def run_training(background_tasks: BackgroundTasks):
    background_tasks.add_task(train_and_reload)
    return {
        "success": True,
        "message": "Model retraining pipeline triggered in the background."
    }

@app.get("/recommendations/similar/{listing_id}")
def get_similar_properties(listing_id: str, top_n: int = 6):
    try:
        recommendations = content_recommender.get_similar_listings(listing_id, top_n)
        return {
            "success": True,
            "listing_id": listing_id,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommendations/collaborative/{user_id}")
def get_collaborative_recommendations(user_id: str, top_n: int = 6):
    try:
        recommendations = collaborative_recommender.get_collaborative_recommendations(user_id, top_n)
        return {
            "success": True,
            "user_id": user_id,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommendations/hybrid")
def get_hybrid_recommendations(user_id: str = None, top_n: int = 6, alpha: float = 0.5):
    try:
        recommendations = hybrid_recommender.get_hybrid_recommendations(user_id, top_n, alpha)
        return {
            "success": True,
            "user_id": user_id,
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
