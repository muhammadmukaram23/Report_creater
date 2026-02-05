# Report Management API

FastAPI system with raw SQL queries for managing schemes and components with image upload functionality.

## Features

- ✅ Complete CRUD operations for Scheme
- ✅ Complete CRUD operations for Component
- ✅ Image upload for before/after images
- ✅ Raw SQL queries (no ORM)
- ✅ Async database operations
- ✅ Auto-generated API documentation
- ✅ CORS support for frontend integration
- ✅ File validation and size limits

## Project Structure

```
rpeort formate/
├── main.py                 # Main FastAPI application
├── database.py             # Database connection & utilities
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
├── .env.example           # Environment variables template
├── README.md              # This file
├── db.sql                 # Database schema
└── uploads/               # Image storage
    ├── before/            # Before images
    └── after/             # After images
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Database

Create a `.env` file from the example:

```bash
copy .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=report_db
```

### 3. Create Database

Execute the SQL schema:

```bash
mysql -u root -p < db.sql
```

Or manually create the database and run the schema.

### 4. Run the Server

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Scheme Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scheme` | Create a new scheme |
| GET | `/api/scheme` | Get all schemes |
| GET | `/api/scheme/{gs_no}` | Get scheme by ID |
| PUT | `/api/scheme/{gs_no}` | Update scheme |
| DELETE | `/api/scheme/{gs_no}` | Delete scheme |

### Component Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/component` | Create a new component |
| GET | `/api/component` | Get all components |
| GET | `/api/component?gs_no={id}` | Get components by scheme |
| GET | `/api/component/{comp_id}` | Get component by ID |
| PUT | `/api/component/{comp_id}` | Update component |
| DELETE | `/api/component/{comp_id}` | Delete component |
| GET | `/api/component/{comp_id}/images` | Get image URLs |

### Image Upload Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/before` | Upload before image |
| POST | `/api/upload/after` | Upload after image |
| GET | `/uploads/before/{filename}` | Access before image |
| GET | `/uploads/after/{filename}` | Access after image |

## Usage Examples

### Create a Scheme

```bash
curl -X POST "http://localhost:8000/api/scheme" \
  -H "Content-Type: application/json" \
  -d '{
    "gs_no": 1,
    "sr_no": 101,
    "name_of_scheme": "Road Construction Project",
    "starting_date": "2026-01-01",
    "physical_progress": 45.5,
    "total_allocation": 1000000,
    "funds_released": 500000,
    "committed_fund_utilization": 450000,
    "labour_deployed": 50,
    "remarks": "On track"
  }'
```

### Upload Before Image

```bash
curl -X POST "http://localhost:8000/api/upload/before" \
  -F "file=@path/to/image.jpg"
```

### Create Component with Images

```bash
# 1. Upload images first
curl -X POST "http://localhost:8000/api/upload/before" -F "file=@before.jpg"
# Returns: {"filename": "uuid.jpg", "url": "/uploads/before/uuid.jpg"}

curl -X POST "http://localhost:8000/api/upload/after" -F "file=@after.jpg"
# Returns: {"filename": "uuid2.jpg", "url": "/uploads/after/uuid2.jpg"}

# 2. Create component with the returned filenames
curl -X POST "http://localhost:8000/api/component" \
  -H "Content-Type: application/json" \
  -d '{
    "comp_id": 1,
    "component_name": "Foundation Work",
    "before_image": "uuid.jpg",
    "after_image": "uuid2.jpg",
    "gs_no": 1
  }'
```

### Get All Schemes

```bash
curl "http://localhost:8000/api/scheme"
```

### Get Components by Scheme

```bash
curl "http://localhost:8000/api/component?gs_no=1"
```

### Update Component

```bash
curl -X PUT "http://localhost:8000/api/component/1" \
  -H "Content-Type: application/json" \
  -d '{
    "component_name": "Foundation & Plinth Work"
  }'
```

## File Upload Specifications

- **Allowed Formats**: PNG, JPG, JPEG, GIF, WEBP
- **Max File Size**: 10MB
- **Storage**: Files stored in `uploads/before/` and `uploads/after/`
- **Naming**: UUID-based filenames to prevent conflicts

## Database Schema

### Scheme Table

- `gs_no` (INT, PRIMARY KEY)
- `sr_no` (INT)
- `name_of_scheme` (VARCHAR)
- `starting_date` (DATE)
- `physical_progress` (DECIMAL)
- `total_allocation` (DECIMAL)
- `funds_released` (DECIMAL)
- `committed_fund_utilization` (DECIMAL)
- `labour_deployed` (INT)
- `remarks` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Component Table

- `comp_id` (INT, PRIMARY KEY)
- `component_name` (VARCHAR)
- `before_image` (VARCHAR)
- `after_image` (VARCHAR)
- `created_at` (TIMESTAMP)
- `gs_no` (INT, FOREIGN KEY)

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input or validation error
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## CORS Configuration

CORS is enabled for the following origins (configurable in `config.py`):

- http://localhost:3000
- http://localhost:5173
- http://127.0.0.1:3000
- http://127.0.0.1:5173

## Development

To run in development mode with auto-reload:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Production Deployment

For production, use:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or use a process manager like systemd or PM2.

## License

MIT
