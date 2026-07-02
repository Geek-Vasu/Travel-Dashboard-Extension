import sys
import os

backend_path = r"c:\Users\LENOVO\Documents\travel\backend"
sys.path.insert(0, backend_path)

try:
    from app.main import scan_progress
    print(f"scan_progress: {scan_progress}")
except Exception as e:
    import traceback
    traceback.print_exc()
