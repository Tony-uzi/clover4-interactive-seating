# Clover 4 - Interactive Event Layout & Seating Management System

Clover 4 is a comprehensive event management platform designed for conferences and trade shows. It provides intuitive tools for event organizers to design layouts, manage attendees, and facilitate smooth check-in processes, along with public-facing kiosk interfaces for attendee self-service.

## Features

### Conference Management
- **Interactive Floor Planning**: Drag-and-drop canvas editor for creating conference seating layouts with customizable table shapes (rectangular, round, banquet)
- **Guest Management**: Import attendees via CSV, assign seating, and track check-in status
- **Group Organization**: Create and manage groups with color-coded tables
- **Visual Elements**: Add doors, stages, and custom decorations to your layout
- **QR Code Check-in**: Generate QR codes for contactless attendee check-in
- **Shareable Views**: Create public share links for attendees to view seating arrangements

### Trade Show Management
- **Booth Layout Designer**: Create exhibition floor plans with vendor booths of various types (standard, premium, corner, island)
- **Vendor Management**: Import vendors via CSV and assign booth locations
- **Route Planning**: Design visitor routes with color-coded paths and descriptions
- **Resource Tracking**: Manage booth amenities (WiFi, power outlets, display equipment)
- **Interactive Directory**: Browse vendors by category with search functionality

### Kiosk Mode
- **Self-Service Check-in**: Touchscreen-friendly interface for attendees to check themselves in
- **Seat Finder**: Attendees can search for their assigned seats and view the layout
- **Vendor Directory**: Browse trade show exhibitors and find booth locations
- **Schedule Viewer**: Display event schedules and session information
- **Multi-Event Support**: Switch between different events from the kiosk interface

### Admin Features
- **User Authentication**: Secure login system with JWT token-based authentication
- **Multi-Event Management**: Create and manage multiple events simultaneously
- **Export Capabilities**: Generate PDF reports of layouts and attendee lists
- **Real-time Updates**: Changes to layouts and assignments reflect immediately across all views
- **Session Management**: Track active sessions and manage event switching

## Getting Started

### Prerequisites

- **Docker & Docker Compose**: Required for containerized deployment
- **Node.js 18+**: For local frontend development (optional)
- **Python 3.11+**: For local backend development (optional)

### Quick Start with Docker Compose

The easiest way to run the entire application stack is using Docker Compose:

1. **Clone the repository**
   ```bash
   git clone
   cd clover4-interactive-seating
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database (port 5432)
   - Django backend API (port 8000)
   - React frontend (port 80)
   - pgAdmin database manager (port 5050)

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/
   - pgAdmin: http://localhost:5050 (login: admin@event.com / admin)

4. **Create an admin account**
   
   Navigate to the signup page or use the Django admin:
   ```bash
   docker-compose exec backend-service python manage.py createsuperuser
   ```

5. **Stop all services**
   ```bash
   docker-compose down
   ```

### Local Development Setup

#### Backend Development

1. **Navigate to backend directory**
   ```bash
   cd event-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables**
   ```bash
   export DEBUG=True
   export DATABASE_ENGINE=django.db.backends.sqlite3
   export DATABASE_NAME=db.sqlite3
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at http://localhost:8000

#### Frontend Development

1. **Navigate to frontend directory**
   ```bash
   cd event-layout
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at http://localhost:5173

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
clover4-interactive-seating/
├── event-backend/          # Django REST API backend
│   ├── api/               # API application
│   │   ├── models.py      # Database models
│   │   ├── serializers.py # API serializers
│   │   ├── views_*.py     # API views (auth, conference, tradeshow)
│   │   └── urls.py        # URL routing
│   ├── clover/            # Django project settings
│   ├── media/             # User uploaded files
│   └── requirements.txt   # Python dependencies
├── event-layout/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   │   ├── conference/  # Conference-specific components
│   │   │   ├── tradeshow/   # Trade show-specific components
│   │   │   └── shared/      # Shared UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and helpers
│   │   └── server-actions/ # API client functions
│   ├── public/            # Static assets
│   └── package.json       # Node dependencies
├── k8s/                   # Kubernetes deployment manifests
├── docker-compose.yml     # Docker Compose configuration
├── build-and-push.sh     # Docker image build script
└── deploy-gke.sh         # GKE deployment script
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - User login
- `GET /api/auth/profile/` - Get user profile

### Conference Management
- `GET /api/conference/events/` - List conference events
- `POST /api/conference/events/` - Create conference event
- `GET /api/conference/events/:id/` - Get event details
- `PUT /api/conference/events/:id/` - Update event
- `POST /api/conference/events/:id/guests/import/` - Import guests from CSV
- `POST /api/conference/events/:id/share/` - Create shareable link
- `GET /api/conference/share/:token/` - View shared layout

### Trade Show Management
- `GET /api/tradeshow/events/` - List trade show events
- `POST /api/tradeshow/events/` - Create trade show event
- `GET /api/tradeshow/events/:id/` - Get event details
- `PUT /api/tradeshow/events/:id/` - Update event
- `POST /api/tradeshow/events/:id/vendors/import/` - Import vendors from CSV
- `POST /api/tradeshow/events/:id/share/` - Create shareable link

### Kiosk & Check-in
- `POST /api/qr/checkin/` - QR code check-in
- `GET /api/schedule/sessions/` - Get event schedule

## Deployment on Google Kubernetes Engine (GKE)

The application is designed for cloud deployment on Google Kubernetes Engine with support for auto-scaling and high availability.

### Deployment Overview

The GKE deployment includes:

- **GKE Autopilot Cluster**: Fully managed Kubernetes cluster with automatic node provisioning and scaling
- **Artifact Registry**: Private Docker registry for storing application images
- **PostgreSQL Database**: Persistent database with volume storage
- **Load Balancer**: External access to frontend and backend services
- **Ingress Controller**: HTTP/HTTPS routing and SSL termination support
- **Secrets Management**: Secure storage of database credentials and API keys
- **pgAdmin**: Optional database administration interface

### Deployment Scripts

The repository includes automated deployment scripts:

- **`build-and-push.sh`**: Builds Docker images for frontend and backend, then pushes them to Google Artifact Registry
- **`deploy-gke.sh`**: Creates GKE cluster, configures services, and deploys the application
- **`update-deployment.sh`**: Updates running deployments with new images
- **`cleanup-gke.sh`**: Removes all GKE resources

### Configuration

Key configuration files for Kubernetes deployment are located in the `k8s/` directory:

- `01-namespace.yaml`: Kubernetes namespace isolation
- `02-postgres-pvc.yaml`: Persistent volume for database
- `03-postgres-deployment.yaml`: PostgreSQL database deployment
- `04-backend-deployment.yaml`: Django backend deployment
- `05-frontend-deployment.yaml`: React frontend deployment
- `06-ingress.yaml`: Ingress rules for external access
- `07-pgadmin-deployment.yaml`: Database admin interface

Before deploying, update the `deploy-gke.sh` script with your GCP project ID and preferred region. The deployment process handles all necessary Google Cloud API enablement, resource creation, and application deployment automatically.

## Environment Variables

### Backend (Django)

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `False` |
| `SECRET_KEY` | Django secret key | Required |
| `DATABASE_ENGINE` | Database backend | `django.db.backends.postgresql` |
| `DATABASE_NAME` | Database name | `event_db` |
| `DATABASE_USER` | Database user | `event_user` |
| `DATABASE_PASSWORD` | Database password | Required |
| `DATABASE_HOST` | Database host | `localhost` |
| `DATABASE_PORT` | Database port | `5432` |
| `ALLOWED_HOSTS` | Allowed host headers | `localhost,127.0.0.1` |
| `CORS_ALLOW_ALL_ORIGINS` | Enable CORS for all origins | `False` |

### Frontend (React)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

## Data Import Format

### Guest Import (Conference)

CSV format for importing conference attendees:

```csv
name,email,table_number,group_name,checked_in
John Doe,john@example.com,1,VIP Guests,false
Jane Smith,jane@example.com,2,General Attendees,false
```

### Vendor Import (Trade Show)

CSV format for importing trade show vendors:

```csv
company_name,contact_name,email,category,booth_number,booth_type
Tech Corp,John Doe,john@techcorp.com,Technology,A101,premium
Design Co,Jane Smith,jane@designco.com,Creative,B205,standard
```

Example CSV files are included in the `public/` directory.


