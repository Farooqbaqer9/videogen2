
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import requests
import logging
from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import cv2


# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)


# Utility: Extract first frame as thumbnail
def save_thumbnail_from_video(video_url, thumbnail_path):
    try:
        # Download video to temp file
        video_data = requests.get(video_url, stream=True)
        if video_data.status_code == 200:
            with open('temp_video.mp4', 'wb') as f:
                for chunk in video_data.iter_content(chunk_size=8192):
                    f.write(chunk)
            cap = cv2.VideoCapture('temp_video.mp4')
            success, frame = cap.read()
            if success:
                cv2.imwrite(thumbnail_path, frame)
                cap.release()
                os.remove('temp_video.mp4')
                return True
            cap.release()
            os.remove('temp_video.mp4')
        return False
    except Exception as e:
        logger.error(f"Thumbnail extraction failed: {e}")
        return False

load_dotenv()
app = FastAPI()

# Store websocket connections by job_id
websocket_connections = {}

# WebSocket endpoint for job status notifications
@app.websocket("/ws/job/{job_id}")
async def websocket_job_status(websocket: WebSocket, job_id: str):
    await websocket.accept()
    websocket_connections[job_id] = websocket
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        websocket_connections.pop(job_id, None)

# Health check root endpoint for Railway and browsers
@app.get("/")
def read_root():
    return {"message": "VideoGen AI backend is running."}

# SQLite DB setup
DATABASE_URL = "sqlite:///./videogen.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class VideoJob(Base):
    __tablename__ = "video_jobs"
    id = Column(String, primary_key=True, index=True)
    prompt = Column(Text)
    aspect_ratio = Column(String)
    resolution = Column(String)
    duration = Column(Integer)
    background_music = Column(Boolean)
    status = Column(String, default="generating")
    video_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

ARK_API_KEY = os.getenv("ARK_API_KEY")
if ARK_API_KEY:
    logger.info("Ark API key loaded from .env")
else:
    logger.warning("Ark API key NOT found in .env")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoGenerationParams(BaseModel):
    prompt: str
    aspectRatio: str
    resolution: str
    duration: int
    backgroundMusic: bool

@app.post("/api/generate")
def generate_video(params: VideoGenerationParams):
    logger.info(f"Received video generation request: {params}")
    if not ARK_API_KEY:
        logger.error("Ark API key not configured.")
        return {"success": False, "error": "Ark API key not configured."}

    ark_url = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks"
    payload = {
        "model": "seedance-1-0-lite-t2v-250428",
        "content": [
            {
                "type": "text",
                "text": f"{params.prompt} --ratio {params.aspectRatio} --resolution {params.resolution} --duration {params.duration} --camerafixed {'true' if params.backgroundMusic else 'false'}"
            }
        ]
    }
    headers = {
        "Authorization": f"Bearer {ARK_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        logger.info(f"Calling Ark API: {ark_url} with payload: {payload}")
        response = requests.post(ark_url, json=payload, headers=headers)
        logger.info(f"Ark API response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            # The response should contain a top-level 'id' field
            job_id = data.get("id", f"job_{datetime.utcnow().timestamp()}")
            db = SessionLocal()
            job = VideoJob(
                id=job_id,
                prompt=params.prompt,
                aspect_ratio=params.aspectRatio,
                resolution=params.resolution,
                duration=params.duration,
                background_music=params.backgroundMusic,
                status="generating",
                created_at=datetime.utcnow()
            )
            db.add(job)
            db.commit()
            db.close()
            logger.info(f"Saved job {job_id} to DB")
            return {"success": True, "data": {"jobId": job_id}}
        else:
            logger.error(f"Ark API error: {response.text}")
            return {"success": False, "error": response.text}
    except Exception as e:
        logger.exception("Exception during Ark API call")
        return {"success": False, "error": str(e)}

@app.get("/api/status/{job_id}")
def check_status(job_id: str):
    logger.info(f"Checking status for job_id: {job_id}")
    db = SessionLocal()
    job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
    if not job:
        db.close()
        logger.warning(f"Job {job_id} not found in DB")
        return {"success": False, "error": "Job not found"}

    # Poll Bytedance status endpoint for real job status and video URL
    ark_status_url = f"https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks/{job_id}"
    headers = {
        "Authorization": f"Bearer {ARK_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        logger.info(f"Polling Ark status endpoint: {ark_status_url}")
        response = requests.get(ark_status_url, headers=headers)
        logger.info(f"Ark status response code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            logger.info(f"FULL Ark status response data: {data}")
            # Try to extract video_url from all possible locations
            job_status = data.get("status", job.status)
            video_url = data.get("content", {}).get("video_url", job.video_url)
            thumbnail_url = data.get("content", {}).get("thumbnail_url", job.thumbnail_url)
            logger.info(f"Extracted job_status: {job_status}, video_url: {video_url}, thumbnail_url: {thumbnail_url}")
            # Only update if job is succeeded and videoUrl is present
            if job_status in ["completed", "succeeded"] and video_url:
                job.status = job_status
                job.video_url = video_url
                # If no thumbnail_url, generate from first frame
                if not thumbnail_url:
                    thumb_path = f"thumbnails/{job_id}.png"
                    os.makedirs("thumbnails", exist_ok=True)
                    if save_thumbnail_from_video(video_url, thumb_path):
                        job.thumbnail_url = thumb_path
                        logger.info(f"Thumbnail saved for job {job_id} at {thumb_path}")
                    else:
                        job.thumbnail_url = None
                else:
                    job.thumbnail_url = thumbnail_url
                db.commit()
                logger.info(f"Updated job {job_id} in DB with videoUrl: {video_url}")
                # Notify frontend via websocket if connected
                ws = websocket_connections.get(job_id)
                if ws:
                    import asyncio
                    asyncio.create_task(ws.send_json({
                        "id": job.id,
                        "prompt": job.prompt,
                        "videoUrl": job.video_url or "",
                        "thumbnailUrl": job.thumbnail_url or "",
                        "createdAt": job.created_at.isoformat(),
                        "duration": job.duration,
                        "aspectRatio": job.aspect_ratio,
                        "resolution": job.resolution,
                        "status": job.status
                    }))
        else:
            logger.error(f"Ark status API error: {response.text}")
    except Exception as e:
        logger.exception("Exception during Ark status API call")
    # Prepare response
    result = {
        "id": job.id,
        "prompt": job.prompt,
        "videoUrl": job.video_url or "",
        "thumbnailUrl": job.thumbnail_url or "",
        "createdAt": job.created_at.isoformat(),
        "duration": job.duration,
        "aspectRatio": job.aspect_ratio,
        "resolution": job.resolution,
        "status": job.status
    }
    db.close()
    return {"success": True, "data": result}

@app.get("/api/history")
def get_history():
    logger.info("Fetching video history")
    db = SessionLocal()
    jobs = db.query(VideoJob).order_by(VideoJob.created_at.desc()).all()
    db.close()
    history = [
        {
            "id": job.id,
            "prompt": job.prompt,
            "videoUrl": job.video_url or "",
            "thumbnailUrl": job.thumbnail_url or "",
            "createdAt": job.created_at.isoformat(),
            "duration": job.duration,
            "aspectRatio": job.aspect_ratio,
            "resolution": job.resolution,
            "status": job.status
        }
        for job in jobs
    ]
    return {"success": True, "data": history}

@app.delete("/api/video/{video_id}")
def delete_video(video_id: str):
    logger.info(f"Deleting video with id: {video_id}")
    db = SessionLocal()
    job = db.query(VideoJob).filter(VideoJob.id == video_id).first()
    if job:
        db.delete(job)
        db.commit()
        logger.info(f"Deleted job {video_id} from DB")
        db.close()
        return {"success": True}
    else:
        db.close()
        logger.warning(f"Job {video_id} not found for deletion")
        return {"success": False, "error": "Job not found"}
