from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from supabase import create_client, Client
import uuid
import json

# --- Config ---
# You should load these from .env in a real app
# For now, we expect environment variables to be set
import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()



# SUPABASE_URL = os.environ.get("SUPABASE_URL")
# SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

app = FastAPI()

# --- CORS ---
# Allow requests from the frontend
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",
    "https://*.onrender.com",  # Render deployments
    "*" # Relaxed for dev - remove in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Supabase Client ---
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not set.")

# --- Models ---
# distinct models to validate data structure, though we send generic JSON to DB often
class Equipment(BaseModel):
    id: str
    name: str
    category: str
    owner: str
    imageUrl: str
    stock: int = 0
    unit: str
    status: str
    dimensions: str
    weight: str
    description: str
    extraProps: Optional[Dict[str, Any]] = None

class Event(BaseModel):
    id: str
    title: str
    category: str
    status: str
    startDate: str
    endDate: str
    displayContent: Optional[str] = None
    logistics: Dict[str, Any]
    allocations: List[Dict[str, Any]]
    adHocItems: Optional[List[Dict[str, Any]]] = None
    workflow: Optional[List[Dict[str, Any]]] = None
    signatures: Optional[Dict[str, str]] = None
    createdAt: int

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "ok", "service": "EventGrid Backend"}

# 1. Inventory
@app.get("/api/inventory")
def get_inventory():
    if not supabase: return []
    # Fetch all from 'inventory' table
    # Schema assumption: Table 'inventory' has a jsonb column 'data' OR columns matching fields
    # Let's assume we store the whole object in a 'data' column for flexibility, 
    # or fully structured. Let's go with fully structured if possible, but JSON is safer for rapid migration.
    # STRATEGY: We will dump the entire object into a table called 'inventory' with columns: id, json_content
    
    response = supabase.table("inventory").select("*").execute()
    # If using json_content pattern:
    # return [item['json_content'] for item in response.data]
    
    # If using structured columns (preferred for Supabase):
    return response.data

@app.post("/api/inventory/sync")
def sync_inventory(items: List[Dict[str, Any]]):
    """
    Bulk upsert inventory. 
    Replacing the entire list might be heavy, but fine for small datasets (<1000 items).
    Better: Upsert each item.
    """
    if not supabase: raise HTTPException(503, "Database not connected")
    
    # UPSERT
    # Supabase upsert requires the data to match the table schema.
    # If we are lazy, we mapped everything to columns?
    # Let's hope the user creates columns matching the JSON keys.
    # If not, we should probably stick to `id`, `name`, `data` (jsonb).
    # But for this demo, I will assume the table columns MATCH the JSON keys perfectly.
    
    if not items:
        return {"count": 0}

    data = response = supabase.table("inventory").upsert(items).execute()
    return {"status": "success", "count": len(items)}

# 2. Events
@app.get("/api/events")
def get_events():
    if not supabase: return []
    response = supabase.table("events").select("*").execute()
    return response.data

@app.post("/api/events/sync")
def sync_events(items: List[Dict[str, Any]]):
    if not supabase: raise HTTPException(503, "Database not connected")
    if not items:
        return {"count": 0}
    response = supabase.table("events").upsert(items).execute()
    return {"status": "success", "count": len(items)}

# 3. Uploads
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not supabase: raise HTTPException(503, "Storage not connected")
    
    # 1. Read file
    content = await file.read()
    
    # 2. Generate unique path
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    bucket_name = "image" # Helper must create this bucket
    
    # 3. Upload
    # Supabase-py storage upload
    # Note: 'file_options' handling varies by version, usually nice to set content-type
    try:
        res = supabase.storage.from_(bucket_name).upload(
            path=file_name,
            file=content,
            file_options={"content-type": file.content_type}
        )
        
        # 4. Get Public URL
        # Supabase storage public URL format:
        # {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
        public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
        
        return {"url": public_url}
        
    except Exception as e:
        print(f"Upload failed: {e}")
        raise HTTPException(500, f"Upload failed: {str(e)}")

# Fallback for updating a single event (optional but good)
@app.put("/api/events/{event_id}")
def update_event(event_id: str, event: Dict[str, Any]):
    if not supabase: raise HTTPException(503, "DB not connected")
    supabase.table("events").update(event).eq("id", event_id).execute()
    return event

@app.delete("/api/events/{event_id}")
def delete_event(event_id: str):
    if not supabase: raise HTTPException(503, "DB not connected")
    supabase.table("events").delete().eq("id", event_id).execute()
    return {"status": "success", "id": event_id}

@app.delete("/api/inventory/{item_id}")
def delete_inventory_item(item_id: str):
    if not supabase: raise HTTPException(503, "DB not connected")
    supabase.table("inventory").delete().eq("id", item_id).execute()
    return {"status": "success", "id": item_id}
