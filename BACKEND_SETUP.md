# Backend Setup Guide

## 1. Supabase Setup
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. **Database Tables**:
   - Go to Table Editor and create two tables: `inventory` and `events`.
   - **Table `inventory`**: Columns matching `Equipment` interface (or just `id` (text, PK) and `...` columns).
     - *Alternative (Simple)*: Just create columns matching the fields in `types.ts`.
     - *Important*: Ensure Row Level Security (RLS) is configured (or disabled for development).
   - **Table `events`**: Columns matching `Event` interface.
3. **Storage**:
   - Create a bucket named `images`.
   - Set policy to "Public" so images can be viewed.

## 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

## 3. Run Backend
Requirement: Python 3.8+
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
The server will start at `http://localhost:8000`.

## 4. Frontend Configuration
Ensure your frontend `.env` (or `.env.local`) has:
```
VITE_API_URL=http://localhost:8000/api
```
