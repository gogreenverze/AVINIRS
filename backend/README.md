# RSAVINI Backend API

This is the backend API for the RSAVINI Laboratory Information System. It provides RESTful endpoints for the React frontend to interact with.

## Technology Stack

- **Framework**: Flask
- **Authentication**: JWT
- **Database**: JSON files (for simplicity)

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip

### Installation

1. Create a virtual environment (optional but recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Initialize mock data
```bash
python init_data.py
```

4. Start the server
```bash
python app.py
```

The API will be available at http://localhost:5000

## API Endpoints

### Authentication

- `POST /api/auth/login`: Login with username and password
- `GET /api/auth/user`: Get current user information

### Patients

- `GET /api/patients`: Get all patients
- `GET /api/patients/<id>`: Get a specific patient
- `POST /api/patients`: Create a new patient
- `PUT /api/patients/<id>`: Update a patient
- `DELETE /api/patients/<id>`: Delete a patient
- `GET /api/patients/search`: Search patients

### Samples

- `GET /api/samples`: Get all samples
- `GET /api/samples/<id>`: Get a specific sample
- `POST /api/samples`: Create a new sample
- `PUT /api/samples/<id>`: Update a sample
- `DELETE /api/samples/<id>`: Delete a sample
- `GET /api/samples/search`: Search samples
- `GET /api/samples/types`: Get all sample types
- `GET /api/samples/containers`: Get all containers
- `GET /api/samples/routing`: Get sample routing information

### Results

- `GET /api/results`: Get all results
- `GET /api/results/<id>`: Get a specific result
- `POST /api/results`: Create a new result
- `PUT /api/results/<id>`: Update a result
- `POST /api/results/<id>/verify`: Verify a result
- `GET /api/results/search`: Search results
- `GET /api/results/reports`: Get result reports

### Billing

- `GET /api/billing`: Get all billings
- `GET /api/billing/<id>`: Get a specific billing
- `POST /api/billing`: Create a new billing
- `PUT /api/billing/<id>`: Update a billing
- `POST /api/billing/<id>/collect`: Collect payment for a billing
- `GET /api/billing/search`: Search billings

### Admin

- `GET /api/admin/analytics`: Get analytics data
- `GET /api/admin/users`: Get all users
- `GET /api/admin/users/<id>`: Get a specific user
- `POST /api/admin/users`: Create a new user
- `PUT /api/admin/users/<id>`: Update a user
- `DELETE /api/admin/users/<id>`: Delete a user
- `GET /api/admin/franchises`: Get all franchises
- `GET /api/admin/franchises/<id>`: Get a specific franchise

## Authentication

All API endpoints (except for login) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is obtained by calling the login endpoint with valid credentials.
