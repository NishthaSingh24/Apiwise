# APIWise — Setup and Deployment Guide

This guide covers local developer setup, Docker containerization, configuration options, and troubleshooting steps for **APIWise — Intelligent API Testing and Automation Platform**.

---

## Prerequisites

Ensure your host environment has the following installed:

- **Java Development Kit (JDK)**: Java 21 or newer (`java -version`)
- **Apache Maven**: Version 3.8+ (`mvn -version`)
- **Node.js**: Version 18+ or 20+ (`node -v`, `npm -v`)
- **PostgreSQL**: Version 15+ (if running bare-metal) or **Docker Desktop**
- **Git**

---

## 1. Quickstart with Docker Compose

The fastest way to spin up the entire APIWise stack (PostgreSQL, Spring Boot Backend, and React Vite Frontend with Nginx) is via Docker Compose.

### Step 1: Copy Environment Variables
```bash
cp .env.example .env
```
Edit `.env` to configure your passwords and keys if necessary.

### Step 2: Build and Launch Containers
```bash
docker-compose up --build -d
```

### Step 3: Access the Application
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **Swagger UI Interactive Docs**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Actuator Health Check**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

### Step 4: Stop Containers
```bash
docker-compose down
```
To remove persistent database volumes:
```bash
docker-compose down -v
```

---

## 2. Local Bare-Metal Development Setup

If you prefer running services directly on your host machine for development:

### A. Database Setup (PostgreSQL)
1. Ensure PostgreSQL is active on port `5432`.
2. Create the `apiwise` database:
   ```sql
   CREATE DATABASE apiwise;
   ```
3. Set your credentials in `backend/src/main/resources/application.yml` or set environment variables:
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=apiwise
   export DB_USER=postgres
   export DB_PASSWORD=your_password
   ```

### B. Backend Setup (Spring Boot 3)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run automated tests:
   ```bash
   mvn test
   ```
3. Run the Spring Boot application (Flyway will automatically execute `V1__init_schema.sql` on startup):
   ```bash
   mvn spring-boot:run
   ```
4. Verify backend health:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

### C. Frontend Setup (React + Vite)
1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build for production or start the Vite development server:
   ```bash
   # Development hot-reloading server:
   npm run dev

   # Production build verification:
   npm run build
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 3. Configuration Reference

All settings can be configured via environment variables or in `application.yml`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DB_HOST` | PostgreSQL hostname | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `apiwise` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL user password | `postgres` |
| `JWT_SECRET` | 512-bit HMAC SHA secret for signing JWTs | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` |
| `ENCRYPTION_KEY` | 32-character AES secret for variable encryption | `ApiWiseSecretEncKeyForEnvVars2026!` |
| `ALLOW_LOOPBACK_REQUESTS` | Set `true` only in test environments to allow localhost calls | `false` |
| `OPENAI_API_KEY` | Optional OpenAI API Key for LLM assistant | *(empty)* |
| `OPENAI_MODEL` | Optional model name | `gpt-4o-mini` |

---

## 4. Troubleshooting

### Port 8080 Already in Use
If port 8080 is occupied by another process:
```powershell
# Windows PowerShell:
Get-NetTCPConnection -LocalPort 8080 | Format-Table OwningProcess
Stop-Process -Id <PID> -Force
```

### PostgreSQL Authentication Failed
Verify that your database user and password match `application.yml` or your `.env` file. You can test connectivity with:
```bash
psql -U postgres -d apiwise -h localhost
```

### Flyway Migration Conflicts
If you modified migration scripts locally after running them:
```sql
DROP DATABASE apiwise;
CREATE DATABASE apiwise;
```
Restart the backend and Flyway will re-apply all migrations cleanly.

### SSRF Blocked In Local Testing
If you are testing against mock APIs on `localhost` or `127.0.0.1`, set:
```bash
export ALLOW_LOOPBACK_REQUESTS=true
```
*(In production, this must always remain `false` to prevent internal network scanning).*
