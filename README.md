# Peer Service Marketplace
Team Umizoomi — Brady Stillman, Elvin Fonseca, Hiromi Nurse, Jalen Hobbs, Kyle Snell, Mike Roddy

A web platform where people can offer and find local gig-based services. Think tutoring, handyman work, tech help, etc. Users can list services, book appointments, pay through the platform, and leave reviews.

---

## Tech Stack

- **Frontend** — React (Vite)
- **Backend** — Django + Django REST Framework
- **Database** — SQLite (local dev)
- **Cloud** — Amazon AWS EC2 (Ubuntu)
- **Version Control** — GitHub

---

## Project Structure

```
peer-service-marketplace/
├── backend/        Django REST API
├── frontend/       React app
└── venv/           Python virtual environment (don't commit this)
```

The backend is split into apps by feature: `users`, `services`, `bookings`, `payments`, `messaging`, and `reviews`.

---

## Getting Started

**Backend**
```bash
cd backend
source ../venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:8000`.

---

## What's Done So Far

- Django project set up with all six apps scaffolded
- React app set up with a basic login page and main page
- CORS configured so the frontend and backend can talk to each other
