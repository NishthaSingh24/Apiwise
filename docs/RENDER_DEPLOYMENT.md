# APIWise — Render Deployment Guide (100% Free Cloud Hosting)

This guide walks you through deploying **APIWise** on [Render.com](https://render.com) using the included `render.yaml` Blueprint or manual web services.

---

## Method 1: 1-Click Blueprint Deployment (Recommended)

Render provides an Infrastructure-as-Code feature called **Blueprints**. We have included `render.yaml` in your repository which automatically sets up:
1. **Managed PostgreSQL Database** (`apiwise-db`)
2. **Spring Boot 3 Web Service** (`apiwise-backend`)
3. **React 18 Static Frontend** (`apiwise-frontend`) with SPA rewrites

### Steps:
1. Log in to [dashboard.render.com](https://dashboard.render.com) (sign in with your GitHub account).
2. In the top navigation, click **"Blueprints"** (or click **New +** → **Blueprint**).
3. Connect your repository: **`NishthaSingh24/Apiwise`**.
4. Render will automatically detect `render.yaml` and display the 3 resources:
   - `apiwise-db` (PostgreSQL Database)
   - `apiwise-backend` (Docker Web Service)
   - `apiwise-frontend` (Static Site)
5. Click **"Apply"**.
6. Render will start provisioning the database, building the Docker container, and deploying the frontend!

---

## Method 2: Manual Setup (If preferred)

If you prefer configuring each service individually in the Render UI:

### Step 1: Create the PostgreSQL Database
1. Click **New +** → **PostgreSQL**.
2. **Name**: `apiwise-db`
3. **Database**: `apiwise`
4. **User**: `postgres`
5. **Plan**: Select **Free**.
6. Click **Create Database**.
7. Once created, keep the database page open and copy:
   - **Internal Database URL** (e.g., `postgres://postgres:password@dpg-...-a/apiwise`)
   - Or note down the `Host`, `Port`, `Database`, `Username`, and `Password`.

---

### Step 2: Deploy the Backend (Spring Boot Docker)
1. Click **New +** → **Web Service**.
2. Select your GitHub repository: `NishthaSingh24/Apiwise`.
3. Configure the service:
   - **Name**: `apiwise-backend`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker** (it will use `backend/Dockerfile`)
   - **Plan**: Select **Free**.
4. In **Environment Variables**, add:
   - `DB_HOST`: *(Host from your Render Postgres database)*
   - `DB_PORT`: `5432`
   - `DB_NAME`: `apiwise`
   - `DB_USER`: *(User from your Render Postgres)*
   - `DB_PASSWORD`: *(Password from your Render Postgres)*
   - `JWT_SECRET`: `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`
   - `ENCRYPTION_KEY`: `ApiWiseSecretEncKeyForEnvVars2026!`
   - `ALLOW_LOOPBACK_REQUESTS`: `false`
5. Click **Create Web Service**.
6. Once deployed, note your backend URL: e.g. `https://apiwise-backend.onrender.com`.
7. You can verify it by opening `https://apiwise-backend.onrender.com/actuator/health` (returns `{"status":"UP"}`).

---

### Step 3: Deploy the Frontend (React Static Site)
1. Click **New +** → **Static Site**.
2. Select your GitHub repository: `NishthaSingh24/Apiwise`.
3. Configure:
   - **Name**: `apiwise-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://apiwise-backend.onrender.com` *(use your actual backend URL from Step 2)*
5. In **Redirects / Rewrites**:
   - Add a rewrite rule:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
   *(This ensures refreshing routes like `/collections` or `/test-builder` works cleanly).*
6. Click **Create Static Site**.
7. Render will build and publish your site with a live URL: e.g. `https://apiwise-frontend.onrender.com`!

---

## ⚡ Important Note on Render Free Tier Sleeping

On Render's free tier, Web Services "spin down" after 15 minutes of inactivity:
- When you first open the web application after inactivity, the backend may take 30–50 seconds to wake up.
- Once awake, response times return to normal speed.
- The PostgreSQL database and static frontend remain online.
