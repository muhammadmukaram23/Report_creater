from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from itertools import zip_longest
import uuid
import os
from pathlib import Path
import io
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from fastapi.responses import StreamingResponse
import requests
from fastapi.responses import JSONResponse

import database
from config import CORS_ORIGINS, BEFORE_IMAGE_DIR, AFTER_IMAGE_DIR, ALLOWED_EXTENSIONS, MAX_FILE_SIZE

# Initialize FastAPI app
app = FastAPI(
    title="Report Management API",
    description="API for managing schemes and components with raw SQL queries",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ============== Pydantic Models ==============

class SchemeCreate(BaseModel):
    gs_no: int
    sr_no: Optional[int] = None
    name_of_scheme: Optional[str] = None
    physical_progress: Optional[Decimal] = None
    total_allocation: Optional[Decimal] = None
    funds_released: Optional[Decimal] = None
    committed_fund_utilization: Optional[Decimal] = None
    labour_deployed: Optional[int] = None
    remarks: Optional[str] = None


class SchemeUpdate(BaseModel):
    sr_no: Optional[int] = None
    name_of_scheme: Optional[str] = None
    physical_progress: Optional[Decimal] = None
    total_allocation: Optional[Decimal] = None
    funds_released: Optional[Decimal] = None
    committed_fund_utilization: Optional[Decimal] = None
    labour_deployed: Optional[int] = None
    remarks: Optional[str] = None


class SchemeResponse(BaseModel):
    gs_no: int
    sr_no: Optional[int]
    name_of_scheme: Optional[str]
    physical_progress: Optional[Decimal]
    total_allocation: Optional[Decimal]
    funds_released: Optional[Decimal]
    committed_fund_utilization: Optional[Decimal]
    labour_deployed: Optional[int]
    remarks: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]


class ComponentCreate(BaseModel):
    comp_id: Optional[int] = None
    component_name: Optional[str] = None
    starting_date: Optional[str] = None
    before_images: Optional[List[str]] = []
    after_images: Optional[List[str]] = []
    gs_no: Optional[int] = None
    is_active: bool = True


class ComponentUpdate(BaseModel):
    component_name: Optional[str] = None
    starting_date: Optional[str] = None
    before_images: Optional[List[str]] = None
    after_images: Optional[List[str]] = None
    gs_no: Optional[int] = None
    is_active: Optional[bool] = None


class ComponentResponse(BaseModel):
    comp_id: int
    component_name: Optional[str]
    starting_date: Optional[str]
    before_images: List[str] = []
    after_images: List[str] = []
    created_at: Optional[datetime]
    gs_no: Optional[int]
    is_active: bool = True


# ============== Startup and Shutdown ==============

@app.on_event("startup")
async def startup():
    """Initialize database connection pool on startup"""
    await database.create_pool()
    print("✅ Database connection pool created")
    
    # Migration: Move starting_date from scheme to component
    try:
        # 1. Add column to component if it doesn't exist
        print("🛠️ Running migration: Checking/Adding starting_date to component table...")
        columns_comp = await database.fetch_all("SHOW COLUMNS FROM component LIKE 'starting_date'")
        if not columns_comp:
            await database.execute("ALTER TABLE component ADD COLUMN starting_date DATE")
            print("✅ Added starting_date to component table")
        
        # 2. Migrate data from scheme to components
        print("🛠️ Running migration: Copying dates from schemes to components...")
        # Check if starting_date still exists in scheme to avoid error if already dropped
        columns_scheme = await database.fetch_all("SHOW COLUMNS FROM scheme LIKE 'starting_date'")
        if columns_scheme:
            await database.execute("""
                UPDATE component c
                JOIN scheme s ON c.gs_no = s.gs_no
                SET c.starting_date = s.starting_date
                WHERE c.starting_date IS NULL AND s.starting_date IS NOT NULL
            """)
            print("✅ Data migration successful")
            
            # 3. Optional: Drop column from scheme
            # await database.execute("ALTER TABLE scheme DROP COLUMN starting_date")
            # print("✅ Dropped starting_date from scheme table")
        else:
            print("ℹ️ Migration already completed or starting_date column missing from scheme")
            
    except Exception as e:
        print(f"⚠️ Migration Error: {e}")

    # Diagnostic: Print current schemes in DB
    try:
        schemes = await database.fetch_all("SELECT gs_no, name_of_scheme FROM scheme")
        print(f"🔍 Startup Diagnostic: {len(schemes)} schemes found in DB")
        for s in schemes:
            print(f"   - GS_NO: {s['gs_no']}, Name: {s['name_of_scheme']}")
    except Exception as e:
        print(f"❌ Startup Scheme Diagnostic Error: {e}")


@app.on_event("shutdown")
async def shutdown():
    """Close database connection pool on shutdown"""
    await database.close_pool()
    print("✅ Database connection pool closed")


# ============== Helper Functions ==============

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_upload_file(upload_file: UploadFile, destination: Path) -> str:
    """Save uploaded file and return filename"""
    # Generate unique filename
    file_extension = upload_file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = destination / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(upload_file.file.read())
    
    return unique_filename


# ============== External API Proxy ==============

# CFY Review (Punjab SMDP)
BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6InNvLmRldi50b3VyIiwiQ2xpZW50SVAiOiIxMTYuOTAuMTI1LjE4OCIsIm5iZiI6MTc3MDQ3Njg0NSwiZXhwIjoxNzcwNTYzMjQ1LCJpYXQiOjE3NzA0NzY4NDV9.1kfu_cV4gVIM2TrtIPBshT2TtXd_ipcjcGP8xj-t3GQ"
EXTERNAL_API_URL = "https://smdpservice.punjab.gov.pk/api/CFYReviewDashboard/GetCFYReviewDashboardListSection"

# Tourism API
TOURISM_API_URL = "https://tourism.datsystems.co/api/projects/"
TOURISM_BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlYjFiN2ZiZS0yZmYwLTQ1NzYtODFmMS00YjlhMTdmMWI1ODMiLCJpYXQiOjE3NzA0MDI5NjQsImV4cCI6MTc3MTAwNzc2NH0.CQIuvI1c5p6cJCzd3KCcv8YD6VNKdhoiSsaHYwBwh28"
REPORTS_API_URL = "https://tourism.datsystems.co/api/reports"

@app.get("/api/get_project")
async def get_project(gsNo: str = Query("", description="GS Number to search"), filterID: str = Query("1", description="Filter ID")):
    """
    Fetch project info dynamically by gsNo and FilterID from external government service
    """
    payload = {
        "FinancialYearId": 12, "UserID": "2127", "UserTypeID": 3, "SubSectorID": None, "sectorID": None,
        "DivisionID": None, "DistrictID": None, "ConstituencyID": None, "TehsilID": None, "DepartmentID": None,
        "DeptGroupID": None, "PPID": None, "SchemeTypeID": None, "SchemeSubTypeID": None, "ProjectStatusTypeID": None,
        "FundingCostType": None, "ValueTypeID": None, "ApprovalStatus": "", "ApprovalStatusCatFilterID": None,
        "IsFullyFunded": None, "ExecutingAgencyIdCSV": "", "SponsorAgencyIdCSV": "", "RegionIdCSV": "",
        "FilterID": filterID, "SearchText": gsNo, "SortColName": "gsNo", "SortDirection": "asc",
        "PageNo": 1, "PageSize": 50, "_search": False, "ListFilterID": None, "nd": 1770477642807
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }

    try:
        response = requests.post(EXTERNAL_API_URL, json=payload, headers=headers)
        if response.status_code == 200:
            return JSONResponse(content=response.json())
        return JSONResponse(content={"error": "Failed to fetch data", "status": response.status_code}, status_code=response.status_code)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/get_project_structure/{project_id}")
async def get_project_structure(project_id: str):
    """
    Fetch project structure from Tourism API
    """
    url = f"{TOURISM_API_URL}{project_id}/structure"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {TOURISM_BEARER_TOKEN}"
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return JSONResponse(content=response.json())
        return JSONResponse(content={"error": "Failed to fetch structure", "status": response.status_code}, status_code=response.status_code)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/get_project_details/{project_id}")
async def get_project_details(project_id: str):
    """
    Fetch comprehensive project details from Tourism API
    """
    url = f"{TOURISM_API_URL}{project_id}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {TOURISM_BEARER_TOKEN}"
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return JSONResponse(content=response.json())
        return JSONResponse(content={"error": "Failed to fetch project details", "status": response.status_code}, status_code=response.status_code)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/get_reports")
async def get_reports():
    """
    Fetch all site reports from Tourism API
    """
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {TOURISM_BEARER_TOKEN}"
    }

    try:
        response = requests.get(REPORTS_API_URL, headers=headers)
        if response.status_code == 200:
            return JSONResponse(content=response.json())
        return JSONResponse(content={"error": "Failed to fetch reports", "status": response.status_code}, status_code=response.status_code)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/api/get_report_details/{report_id}")
async def get_report_details(report_id: str):
    """
    Fetch specific report details
    """
    url = f"{REPORTS_API_URL}/{report_id}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {TOURISM_BEARER_TOKEN}"
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return JSONResponse(content=response.json())
        return JSONResponse(content={"error": "Failed to fetch report details", "status": response.status_code}, status_code=response.status_code)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


# ============== Root Endpoint ==============

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Report Management API",
        "docs": "/docs",
        "version": "1.0.0"
    }


# ============== SCHEME CRUD ENDPOINTS ==============

@app.post("/api/scheme", response_model=dict, status_code=201)
async def create_scheme(scheme: SchemeCreate):
    """Create a new scheme"""
    query = """
        INSERT INTO scheme 
        (gs_no, sr_no, name_of_scheme, physical_progress, 
         total_allocation, funds_released, committed_fund_utilization, 
         labour_deployed, remarks)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    try:
        await database.execute(
            query,
            (
                scheme.gs_no, scheme.sr_no, scheme.name_of_scheme,
                scheme.physical_progress,
                scheme.total_allocation, scheme.funds_released,
                scheme.committed_fund_utilization, scheme.labour_deployed,
                scheme.remarks
            )
        )
        return {"message": "Scheme created successfully", "gs_no": scheme.gs_no}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating scheme: {str(e)}")


@app.get("/api/scheme")
async def get_all_schemes(
    name: Optional[str] = Query(None, description="Filter by scheme name (partial match)"),
    gs_no: Optional[int] = Query(None, description="Filter by GS number (exact match)")
):
    """Get all schemes with optional filtering by name or gs_no"""
    # Build dynamic query based on filters
    query = "SELECT * FROM scheme WHERE 1=1"
    params = []
    
    if name:
        query += " AND name_of_scheme LIKE %s"
        params.append(f"%{name}%")
    
    if gs_no:
        query += " AND gs_no = %s"
        params.append(gs_no)
    
    query += " ORDER BY gs_no"
    
    try:
        raw_schemes = await database.fetch_all(query, tuple(params) if params else None)
        print(f"📡 API Request: /api/scheme -> Found {len(raw_schemes)} schemes in DB (filters: name={name}, gs_no={gs_no})")
        
        # Convert to list of dicts and let FastAPI handle response model conversion
        schemes_list = [dict(s) for s in raw_schemes]
        print(f"✅ Returning {len(schemes_list)} schemes to frontend")
        
        return schemes_list
    except Exception as e:
        print(f"❌ Error in get_all_schemes: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching schemes: {str(e)}")


@app.get("/api/scheme/{gs_no}", response_model=SchemeResponse)
async def get_scheme(gs_no: int):
    """Get a single scheme by gs_no"""
    query = "SELECT * FROM scheme WHERE gs_no = %s"
    
    try:
        scheme = await database.fetch_one(query, (gs_no,))
        if not scheme:
            raise HTTPException(status_code=404, detail=f"Scheme with gs_no {gs_no} not found")
        return scheme
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching scheme: {str(e)}")


@app.put("/api/scheme/{gs_no}", response_model=dict)
async def update_scheme(gs_no: int, scheme: SchemeUpdate):
    """Update a scheme"""
    # First check if scheme exists
    check_query = "SELECT gs_no FROM scheme WHERE gs_no = %s"
    existing = await database.fetch_one(check_query, (gs_no,))
    
    if not existing:
        raise HTTPException(status_code=404, detail=f"Scheme with gs_no {gs_no} not found")
    
    # Build update query dynamically based on provided fields
    update_fields = []
    params = []
    
    if scheme.sr_no is not None:
        update_fields.append("sr_no = %s")
        params.append(scheme.sr_no)
    if scheme.name_of_scheme is not None:
        update_fields.append("name_of_scheme = %s")
        params.append(scheme.name_of_scheme)
    if scheme.physical_progress is not None:
        update_fields.append("physical_progress = %s")
        params.append(scheme.physical_progress)
    if scheme.total_allocation is not None:
        update_fields.append("total_allocation = %s")
        params.append(scheme.total_allocation)
    if scheme.funds_released is not None:
        update_fields.append("funds_released = %s")
        params.append(scheme.funds_released)
    if scheme.committed_fund_utilization is not None:
        update_fields.append("committed_fund_utilization = %s")
        params.append(scheme.committed_fund_utilization)
    if scheme.labour_deployed is not None:
        update_fields.append("labour_deployed = %s")
        params.append(scheme.labour_deployed)
    if scheme.remarks is not None:
        update_fields.append("remarks = %s")
        params.append(scheme.remarks)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Add gs_no to params
    params.append(gs_no)
    
    query = f"UPDATE scheme SET {', '.join(update_fields)} WHERE gs_no = %s"
    
    try:
        await database.execute(query, tuple(params))
        return {"message": "Scheme updated successfully", "gs_no": gs_no}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating scheme: {str(e)}")


@app.delete("/api/scheme/{gs_no}", response_model=dict)
async def delete_scheme(gs_no: int):
    """Delete a scheme and all its associated components and images"""
    print(f"🗑️ Attempting to delete scheme: {gs_no}")
    # Check if scheme exists
    check_query = "SELECT * FROM scheme WHERE gs_no = %s"
    existing = await database.fetch_one(check_query, (gs_no,))
    
    if not existing:
        print(f"❌ Scheme {gs_no} not found for deletion")
        raise HTTPException(status_code=404, detail=f"Scheme with gs_no {gs_no} not found")
    
    # 1. Fetch all components associated with this scheme
    components = await database.fetch_all("SELECT comp_id FROM component WHERE gs_no = %s", (gs_no,))
    
    if components:
        print(f"📦 Found {len(components)} component(s) to delete for scheme {gs_no}")
        comp_ids = [c['comp_id'] for c in components]
        
        # 2. For each component, fetch and delete image files
        for comp_id in comp_ids:
            # Fetch image paths
            img_query = "SELECT image_path, image_type FROM component_images WHERE comp_id = %s"
            images = await database.fetch_all(img_query, (comp_id,))
            
            for img in images:
                try:
                    if img['image_type'] == 'before':
                        path = BEFORE_IMAGE_DIR / img['image_path']
                    else:
                        path = AFTER_IMAGE_DIR / img['image_path']
                    
                    if path.exists():
                        path.unlink()
                        print(f"   - Deleted {img['image_type']} image file: {img['image_path']}")
                except Exception as img_e:
                    print(f"⚠️ Warning: Error deleting image file {img['image_path']}: {img_e}")
        
        # 3. Delete components (component_images will be deleted via DB CASCADE if configured)
        print(f"🧹 Deleting {len(components)} components from database")
        format_strings = ','.join(['%s'] * len(comp_ids))
        await database.execute(f"DELETE FROM component WHERE comp_id IN ({format_strings})", tuple(comp_ids))
    
    # 4. Finally delete the scheme
    query = "DELETE FROM scheme WHERE gs_no = %s"
    
    try:
        await database.execute(query, (gs_no,))
        print(f"✅ Scheme {gs_no} and all associated data successfully deleted")
        return {"message": "Scheme and all associated data deleted successfully", "gs_no": gs_no}
    except Exception as e:
        print(f"❌ Error deleting scheme {gs_no} from DB: {e}")
        raise HTTPException(status_code=400, detail=f"Error deleting scheme: {str(e)}")


# ============== COMPONENT CRUD ENDPOINTS ==============

@app.post("/api/component", response_model=dict, status_code=201)
async def create_component(component: ComponentCreate):
    """Create a new component with multiple images"""
    # Check if gs_no exists if provided
    if component.gs_no:
        check_query = "SELECT gs_no FROM scheme WHERE gs_no = %s"
        scheme_exists = await database.fetch_one(check_query, (component.gs_no,))
        if not scheme_exists:
            raise HTTPException(status_code=404, detail=f"Scheme with gs_no {component.gs_no} not found")
    
    # Insert component - handle both cases: provided comp_id or auto-incremented
    if component.comp_id:
        query = """
            INSERT INTO component 
            (comp_id, component_name, starting_date, gs_no, is_active)
            VALUES (%s, %s, %s, %s, %s)
        """
        params = (component.comp_id, component.component_name, component.starting_date, component.gs_no, component.is_active)
    else:
        query = """
            INSERT INTO component 
            (component_name, starting_date, gs_no, is_active)
            VALUES (%s, %s, %s, %s)
        """
        params = (component.component_name, component.starting_date, component.gs_no, component.is_active)
    
    try:
        # execute() returns lastrowid for INSERTs
        comp_id = await database.execute(query, params)
        
        # Use provided comp_id if available, otherwise use lastrowid
        actual_comp_id = component.comp_id if component.comp_id else comp_id
        
        # Insert before images
        if component.before_images:
            img_query = "INSERT INTO component_images (comp_id, image_path, image_type) VALUES (%s, %s, 'before')"
            img_params = [(actual_comp_id, img) for img in component.before_images]
            await database.execute_many(img_query, img_params)
            
        # Insert after images
        if component.after_images:
            img_query = "INSERT INTO component_images (comp_id, image_path, image_type) VALUES (%s, %s, 'after')"
            img_params = [(actual_comp_id, img) for img in component.after_images]
            await database.execute_many(img_query, img_params)
            
        return {"message": "Component created successfully", "comp_id": actual_comp_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating component: {str(e)}")


@app.get("/api/component", response_model=List[ComponentResponse])
async def get_all_components(gs_no: Optional[int] = Query(None, description="Filter by scheme gs_no")):
    """Get all components with their images, optionally filtered by gs_no"""
    if gs_no is not None:
        query = "SELECT * FROM component WHERE gs_no = %s ORDER BY comp_id"
        params = (gs_no,)
    else:
        query = "SELECT * FROM component ORDER BY comp_id"
        params = None
    
    try:
        print(f"📡 API Request: /api/component?gs_no={gs_no}")
        components = await database.fetch_all(query, params)
        print(f"📊 Found {len(components)} components in DB")
        
        # Fetch images for all these components
        if components:
            comp_ids = [c['comp_id'] for c in components]
            print(f"🔗 Fetching images for component IDs: {comp_ids}")
            format_strings = ','.join(['%s'] * len(comp_ids))
            img_query = f"SELECT comp_id, image_path, image_type FROM component_images WHERE comp_id IN ({format_strings})"
            images = await database.fetch_all(img_query, tuple(comp_ids))
            print(f"🖼️ Found {len(images)} images total")
            
            # Map images to components
            for component in components:
                # Convert date to string if it's a date object to avoid Pydantic validation issues
                if 'starting_date' in component and component['starting_date'] and not isinstance(component['starting_date'], str):
                    component['starting_date'] = str(component['starting_date'])
                
                component['before_images'] = [img['image_path'] for img in images 
                                             if img['comp_id'] == component['comp_id'] and img['image_type'] == 'before']
                component['after_images'] = [img['image_path'] for img in images 
                                            if img['comp_id'] == component['comp_id'] and img['image_type'] == 'after']
        
        print(f"✅ Successfully processed components, returning to frontend")
        return components
    except Exception as e:
        print(f"❌ Error in get_all_components: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching components: {str(e)}")


@app.get("/api/component/{comp_id}", response_model=ComponentResponse)
async def get_component(comp_id: int):
    """Get a single component with its images"""
    query = "SELECT * FROM component WHERE comp_id = %s"
    
    try:
        component = await database.fetch_one(query, (comp_id,))
        if not component:
            raise HTTPException(status_code=404, detail=f"Component with comp_id {comp_id} not found")
            
        # Fetch images
        img_query = "SELECT image_path, image_type FROM component_images WHERE comp_id = %s"
        images = await database.fetch_all(img_query, (comp_id,))
        
        component['before_images'] = [img['image_path'] for img in images if img['image_type'] == 'before']
        component['after_images'] = [img['image_path'] for img in images if img['image_type'] == 'after']
        
        return component
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching component: {str(e)}")


@app.put("/api/component/{comp_id}", response_model=dict)
async def update_component(comp_id: int, component: ComponentUpdate):
    """Update a component including its images"""
    # Check if component exists
    check_query = "SELECT comp_id FROM component WHERE comp_id = %s"
    existing = await database.fetch_one(check_query, (comp_id,))
    
    if not existing:
        raise HTTPException(status_code=404, detail=f"Component with comp_id {comp_id} not found")
    
    # Check if gs_no exists if provided
    if component.gs_no:
        scheme_check = "SELECT gs_no FROM scheme WHERE gs_no = %s"
        scheme_exists = await database.fetch_one(scheme_check, (component.gs_no,))
        if not scheme_exists:
            raise HTTPException(status_code=404, detail=f"Scheme with gs_no {component.gs_no} not found")
    
    # Build update query for component table
    update_fields = []
    params = []
    
    if component.component_name is not None:
        update_fields.append("component_name = %s")
        params.append(component.component_name)
    if component.starting_date is not None:
        update_fields.append("starting_date = %s")
        params.append(component.starting_date)
    if component.gs_no is not None:
        update_fields.append("gs_no = %s")
        params.append(component.gs_no)
    if component.is_active is not None:
        update_fields.append("is_active = %s")
        params.append(component.is_active)
    
    try:
        if update_fields:
            params.append(comp_id)
            query = f"UPDATE component SET {', '.join(update_fields)} WHERE comp_id = %s"
            await database.execute(query, tuple(params))
        
        # Handle before images update (replace if provided)
        if component.before_images is not None:
            # 1. Fetch old images for file cleanup
            old_imgs = await database.fetch_all("SELECT image_path FROM component_images WHERE comp_id = %s AND image_type = 'before'", (comp_id,))
            old_paths = {img['image_path'] for img in old_imgs}
            new_paths = set(component.before_images)
            
            # Delete physical files that are NOT in the new list
            for img_path in old_paths - new_paths:
                try:
                    path = BEFORE_IMAGE_DIR / img_path
                    if path.exists():
                        path.unlink()
                        print(f"🗑️ Cleaned up old before image: {img_path}")
                except Exception as e:
                    print(f"⚠️ Warning: Error deleting old before image {img_path}: {e}")

            # 2. Update DB records
            await database.execute("DELETE FROM component_images WHERE comp_id = %s AND image_type = 'before'", (comp_id,))
            if component.before_images:
                img_query = "INSERT INTO component_images (comp_id, image_path, image_type) VALUES (%s, %s, 'before')"
                img_params = [(comp_id, img) for img in component.before_images]
                await database.execute_many(img_query, img_params)
                
        # Handle after images update (replace if provided)
        if component.after_images is not None:
            # 1. Fetch old images for file cleanup
            old_imgs = await database.fetch_all("SELECT image_path FROM component_images WHERE comp_id = %s AND image_type = 'after'", (comp_id,))
            old_paths = {img['image_path'] for img in old_imgs}
            new_paths = set(component.after_images)
            
            # Delete physical files that are NOT in the new list
            for img_path in old_paths - new_paths:
                try:
                    path = AFTER_IMAGE_DIR / img_path
                    if path.exists():
                        path.unlink()
                        print(f"🗑️ Cleaned up old after image: {img_path}")
                except Exception as e:
                    print(f"⚠️ Warning: Error deleting old after image {img_path}: {e}")

            # 2. Update DB records
            await database.execute("DELETE FROM component_images WHERE comp_id = %s AND image_type = 'after'", (comp_id,))
            if component.after_images:
                img_query = "INSERT INTO component_images (comp_id, image_path, image_type) VALUES (%s, %s, 'after')"
                img_params = [(comp_id, img) for img in component.after_images]
                await database.execute_many(img_query, img_params)
        
        return {"message": "Component updated successfully", "comp_id": comp_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating component: {str(e)}")


@app.delete("/api/component/{comp_id}", response_model=dict)
async def delete_component(comp_id: int):
    """Delete a component and all its associated images"""
    print(f"🗑️ Attempting to delete component: {comp_id}")
    # Check if component exists
    check_query = "SELECT * FROM component WHERE comp_id = %s"
    existing = await database.fetch_one(check_query, (comp_id,))
    
    if not existing:
        print(f"❌ Component {comp_id} not found for deletion")
        raise HTTPException(status_code=404, detail=f"Component with comp_id {comp_id} not found")
    
    # Fetch all associated images for file deletion
    img_query = "SELECT image_path, image_type FROM component_images WHERE comp_id = %s"
    images = await database.fetch_all(img_query, (comp_id,))
    
    # Delete associated image files
    for img in images:
        try:
            if img['image_type'] == 'before':
                path = BEFORE_IMAGE_DIR / img['image_path']
            else:
                path = AFTER_IMAGE_DIR / img['image_path']
            
            if path.exists():
                path.unlink()
                print(f"   - Deleted {img['image_type']} image: {img['image_path']}")
        except Exception as img_e:
            print(f"⚠️ Warning: Error deleting image file {img['image_path']}: {img_e}")
    
    query = "DELETE FROM component WHERE comp_id = %s"
    
    try:
        await database.execute(query, (comp_id,))
        print(f"✅ Component {comp_id} and its images successfully deleted")
        return {"message": "Component and its images deleted successfully", "comp_id": comp_id}
    except Exception as e:
        print(f"❌ Error deleting component {comp_id} from DB: {e}")
        raise HTTPException(status_code=400, detail=f"Error deleting component: {str(e)}")


# ============== PDF REPORT GENERATION ==============

@app.get("/api/reports/all/pdf")
async def generate_pdf_report():
    """Generate a comprehensive PDF report of all schemes and components"""
    try:
        # Fetch all schemes
        schemes = await database.fetch_all("SELECT * FROM scheme ORDER BY gs_no")
        
        # Prepare data for template
        for scheme in schemes:
            # Fetch components for each scheme
            comps = await database.fetch_all("SELECT * FROM component WHERE gs_no = %s ORDER BY comp_id", (scheme['gs_no'],))
            
            for comp in comps:
                # Fetch images for each component
                images = await database.fetch_all(
                    "SELECT image_path, image_type FROM component_images WHERE comp_id = %s", 
                    (comp['comp_id'],)
                )
                
                # Filter before and after images and add full local paths for xhtml2pdf
                before_list = []
                after_list = []
                
                # Only process images if the component is active
                if comp.get('is_active', True):
                    for img in images:
                        img_data = {"path": img['image_path'], "full_path": str((BEFORE_IMAGE_DIR if img['image_type'] == 'before' else AFTER_IMAGE_DIR) / img['image_path'])}
                        if img['image_type'] == 'before':
                            before_list.append(img_data)
                        else:
                            after_list.append(img_data)
                
                # Pair them up for the template (one pair per page)
                comp['image_pairs'] = list(zip_longest(before_list, after_list, fillvalue=None))
            
            scheme['components'] = comps

        # Render HTML template
        env = Environment(loader=FileSystemLoader("templates"))
        template = env.get_template("report.html")
        html_content = template.render(
            schemes=schemes, 
            today=date.today().strftime("%d-%m-%Y"),
            cover_image_path=str(Path("assets/report_cover.png").absolute())
        )

        # Create PDF
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(io.StringIO(html_content), dest=pdf_buffer)

        if pisa_status.err:
            raise HTTPException(status_code=500, detail="Error generating PDF")

        pdf_buffer.seek(0)
        
        filename = f"Priority_Projects_Report_{date.today().strftime('%d_%m_%Y')}.pdf"
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        print(f"❌ PDF Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating PDF report: {str(e)}")


# ============== IMAGE UPLOAD ENDPOINTS ==============

@app.post("/api/upload/before", response_model=dict)
async def upload_before_image(file: UploadFile = File(...)):
    """Upload a before image"""
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    try:
        # Save file
        filename = save_upload_file(file, BEFORE_IMAGE_DIR)
        file_url = f"/uploads/before/{filename}"
        
        return {
            "message": "Before image uploaded successfully",
            "filename": filename,
            "url": file_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@app.post("/api/upload/after", response_model=dict)
async def upload_after_image(file: UploadFile = File(...)):
    """Upload an after image"""
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    try:
        # Save file
        filename = save_upload_file(file, AFTER_IMAGE_DIR)
        file_url = f"/uploads/after/{filename}"
        
        return {
            "message": "After image uploaded successfully",
            "filename": filename,
            "url": file_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


# ============== Image URL Helper Endpoint ==============

@app.get("/api/component/{comp_id}/images")
async def get_component_images(comp_id: int):
    """Get full URLs for all component images"""
    query = "SELECT image_path, image_type FROM component_images WHERE comp_id = %s"
    
    try:
        images = await database.fetch_all(query, (comp_id,))
        
        before_urls = [f"/uploads/before/{img['image_path']}" for img in images if img['image_type'] == 'before']
        after_urls = [f"/uploads/after/{img['image_path']}" for img in images if img['image_type'] == 'after']
        
        return {
            "comp_id": comp_id,
            "before_image_urls": before_urls,
            "after_image_urls": after_urls
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching component images: {str(e)}")


#extrnal api
# Your Bearer token
BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6InNvLmRldi50b3VyIiwiQ2xpZW50SVAiOiIxMTYuOTAuMTI1LjE4OCIsIm5iZiI6MTc3MDQ3Njg0NSwiZXhwIjoxNzcwNTYzMjQ1LCJpYXQiOjE3NzA0NzY4NDV9.1kfu_cV4gVIM2TrtIPBshT2TtXd_ipcjcGP8xj-t3GQ"

# Remote API URL
API_URL = "https://smdpservice.punjab.gov.pk/api/CFYReviewDashboard/GetCFYReviewDashboardListSection"

@app.get("/get_project")
def get_project(gsNo: str = Query("", description="GS Number to search"), filterID: str = Query("1", description="Filter ID")):
    """
    Fetch project info dynamically by gsNo and FilterID
    """
    payload = {
        "FinancialYearId": 12,
        "UserID": "2127",
        "UserTypeID": 3,
        "SubSectorID": None,
        "sectorID": None,
        "DivisionID": None,
        "DistrictID": None,
        "ConstituencyID": None,
        "TehsilID": None,
        "DepartmentID": None,
        "DeptGroupID": None,
        "PPID": None,
        "SchemeTypeID": None,
        "SchemeSubTypeID": None,
        "ProjectStatusTypeID": None,
        "FundingCostType": None,
        "ValueTypeID": None,
        "ApprovalStatus": "",
        "ApprovalStatusCatFilterID": None,
        "IsFullyFunded": None,
        "ExecutingAgencyIdCSV": "",
        "SponsorAgencyIdCSV": "",
        "RegionIdCSV": "",
        "FilterID": filterID,
        "SearchText": gsNo,
        "SortColName": "gsNo",
        "SortDirection": "asc",
        "PageNo": 1,
        "PageSize": 50,
        "_search": False,
        "ListFilterID": None,
        "nd": 1770477642807
    }

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }

    response = requests.post(API_URL, json=payload, headers=headers)

    if response.status_code == 200:
        return JSONResponse(content=response.json())
    else:
        return JSONResponse(
            content={"error": "Failed to fetch data", "status_code": response.status_code},
            status_code=response.status_code
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
