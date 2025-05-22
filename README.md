# RSAVINI - React Implementation of AVINI LIS

This is a React-based implementation of the AVINI Laboratory Information System, maintaining the original theme, appearance, and functionality of the Flask-based application. The application includes Tamil Nadu-specific data and is designed to be a complete replacement for the original Flask application.

## Technology Stack

- **Frontend**: React.js with React Router for navigation
- **UI Framework**: Bootstrap 5 with custom styling to match original theme
- **State Management**: React Context API and hooks
- **API Communication**: Axios for HTTP requests
- **Authentication**: JWT-based authentication
- **Backend**: Flask API with mock data

## Project Structure

The project follows a modular structure similar to the original application:

### Pre-analytical
- Patient Management
- Sample Collection
- Sample Routing

### Analytical
- Laboratory Workflow
- Quality Control
- Instrument Integration

### Post-analytical
- Result Validation
- Result Reporting
- Billing

### Cross-functional
- User Management
- Inventory Management
- Analytics
- Administration

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Python 3.8 or higher
- pip

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd RSAVINI
```

2. Install frontend dependencies
```bash
npm install
```

3. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

4. Initialize mock data for the backend
```bash
cd backend
python init_data.py
cd ..
```

### Running the Application

#### Option 1: Run both servers concurrently (recommended)
```bash
npm run start:dev
```

#### Option 2: Run servers separately
In one terminal:
```bash
npm run start:backend
```

In another terminal:
```bash
npm start
```

The frontend will be available at http://localhost:3000
The backend API will be available at http://localhost:5000/api

### Default Login Credentials

- **Admin User**:
  - Username: admin
  - Password: admin123

- **Lab Technician**:
  - Username: labtech
  - Password: labtech123

- **Receptionist**:
  - Username: reception
  - Password: reception123

### Building for Production

To create a production build:

```bash
npm run build
```

The build files will be created in the `build` directory and can be served using any static file server.

## API Integration

The React application is designed to work with the Flask backend API. The API endpoints are defined in `src/services/api.js` and follow a RESTful structure.

## Authentication

The application uses JWT-based authentication with the following features:
- Token-based authentication
- Protected routes
- Role-based access control

## Tamil Nadu-Specific Data

The application includes mock data specific to Tamil Nadu, including:
- Tamil names for patients
- Tamil Nadu cities and locations
- Local medical facilities and doctors
- Appropriate medical terminology used in the region

## Theme and Styling

The application maintains the original AVINI LIS theme with the following colors:
- Primary: #d4006e (pink)
- Secondary: #222222 (dark gray)
- Success: #1cc88a (green)
- Info: #36b9cc (cyan)
- Warning: #f6c23e (yellow)
- Danger: #e74a3b (red)

The styling is implemented using a combination of Bootstrap 5 and custom CSS.
