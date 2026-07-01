# BCS Preparation Platform

A comprehensive preparation platform designed to help candidates prepare for the Bangladesh Civil Service (BCS) examinations. The platform consists of a backend API service, a Next.js web application, and an Expo-based React Native mobile app.

---

## 🏗️ Architecture Overview

The system is split into three main components:
1. **Backend API (`/api`)**: Built with Django and Django REST Framework, utilizing PostgreSQL as the primary database, Redis for caching/websockets, Daphne for ASGI runtime, and Celery for background queues.
2. **Next.js WebApp (`/webapp/bcs-web`)**: A modern, high-performance web interface built with Next.js 15, Turbopack, and Tailwind CSS.
3. **Expo Mobile App (`/bcs_pre_app_expo`)**: A cross-platform mobile application built using React Native, Expo SDK 56, Redux Toolkit, and NativeWind v4 styling.

```mermaid
graph TD
    subgraph Clients
        Web[Next.js Webapp - Port 3000]
        Mobile[React Native / Expo App]
    end

    subgraph Backend Services
        API[Django ASGI Server - Port 8000]
        Celery[Celery Background Workers]
    end

    subgraph Databases & Cache
        DB[(PostgreSQL Database)]
        Cache[(Redis Cache & Channel Layers)]
    end

    Web -->|HTTP / WebSockets| API
    Mobile -->|HTTP / WebSockets| API
    API --> DB
    API --> Cache
    Celery --> Cache
    Celery --> DB
```

---

## 🛠️ Project Structure & Setup

### Prerequisites
Before running the project locally, ensure you have the following installed:
* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* [Node.js (v20+)](https://nodejs.org/) & `npm`
* [Python (v3.11+)](https://www.python.org/)
* [Expo CLI](https://docs.expo.dev/)

---

### 1. 🐍 Backend API (`/api`)
The backend provides a secure REST API and websocket channels for authentication, question banks, practice sessions, exam simulations, and discussions.

#### Tech Stack:
* Django 5.2 & Django REST Framework
* Daphne (ASGI server supporting WebSockets)
* Celery & Redis
* PostgreSQL

#### Manual Setup:
1. Navigate to the `api` folder:
   ```bash
   cd api
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment template and set up your values:
   ```bash
   cp .env.example .env
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Run the local Daphne server:
   ```bash
   daphne -b 127.0.0.1 -p 8000 bcs_preparation.asgi:application
   ```

---

### 2. 🌐 Next.js WebApp (`/webapp/bcs-web`)
The web portal features three reading themes (Light, Dark, Sepia), size scales, and compact practice layouts.

#### Tech Stack:
* Next.js 15 (Turbopack compiler)
* React 19
* Tailwind CSS (Theme CSS variables integration)

#### Manual Setup:
1. Navigate to the webapp folder:
   ```bash
   cd webapp/bcs-web
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set local environment variables (in `.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Build the production build:
   ```bash
   npm run build
   ```

---

### 3. 📱 Expo Mobile App (`/bcs_pre_app_expo`)
A native mobile client offering offline-ready state management and exam environments.

#### Tech Stack:
* Expo SDK 56 & React Native
* Redux Toolkit & Redux Persist (Offline store hydration)
* NativeWind v4 (Tailwind engine for React Native)
* React Navigation v7

#### Dynamic Styling Rule:
> [!IMPORTANT]
> **Dynamic className rendering inside NativeWind v4**: Avoid toggling colors or layout classes dynamically inside Expo code as it forces compiling utility configurations on the fly and triggers bundle re-generation. 
> Keep layouts/borders static and use inline overrides for dynamic states instead:
> ```tsx
> style={{
>   backgroundColor: isSelected ? '#7c3aed' : '#ffffff',
>   borderColor: isSelected ? '#7c3aed' : '#e2e8f0',
> }}
> ```

#### Local Run:
1. Navigate to the Expo folder:
   ```bash
   cd bcs_pre_app_expo
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Expo bundler:
   ```bash
   npx expo start -c
   ```
4. Scan the QR code using the **Expo Go** app, or press `a` to run on Android or `i` for iOS.

---

## 🐳 Docker Deployment (Full Stack)

The entire backend and frontend stack can be run in seconds using Docker Compose.

```bash
# Build and run all services in detached mode
docker compose up -d --build
```

### Services Mapped:
* **PostgreSQL Database** (`bcs_db`): Port `5432`
* **Redis Cache Layer** (`bcs_redis`): Port `6379`
* **Django API Server** (`bcs_api`): Port `8000` (auto-creates a superuser `admin` / `adminpass` on first run)
* **Next.js WebApp** (`bcs_webapp`): Port `3000`

```bash
# Check container status
docker compose ps

# View service logs
docker compose logs -f
```

---
