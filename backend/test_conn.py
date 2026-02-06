import os
from dotenv import load_dotenv
from supabase import create_client
import httpx

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"Testing connection to: {url}")

try:
    # 1. Test generic HTTP
    print("1. Testing ping...")
    r = httpx.get(url, timeout=5)
    print(f"   Ping status: {r.status_code} (It is normal to get 404 or similar, as long as it connects)")
    
    # 2. Test Client
    print("2. Testing Supabase Client...")
    supabase = create_client(url, key)
    # Simple query
    res = supabase.table("inventory").select("count", count="exact").execute()
    print("   Connection Successful!")
    print(f"   Data: {res}")

except Exception as e:
    print("\n[Connection FAILED]")
    print(e)
