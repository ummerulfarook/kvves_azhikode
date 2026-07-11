# Client Installation & Deployment Guide
## KVVES Community Finance & Member Management System

This guide outlines the step-by-step procedure to push the project to GitHub, clone it, configure it, and run the KVVES Management System on a client's system.

---

## 0. Version Control: How to Push to GitHub (Developer's Machine)

Follow these steps to push your local codebase to a GitHub repository:

1. **Open Command Prompt / PowerShell** and navigate to the project root directory:
   ```cmd
   cd c:\Users\ummer\OneDrive\Desktop\kvva
   ```
2. **Initialize Git** (if not already done):
   ```cmd
   git init
   ```
3. **Stage all changes**:
   Our configured `.gitignore` will automatically skip virtual environments (`venv`), node modules (`node_modules`), builds (`dist`), local databases (`db.sqlite3`), backups (`backups/`), and environment secrets (`.env`).
   ```cmd
   git add .
   ```
4. **Commit the files**:
   ```cmd
   git commit -m "Initial commit of KVVES Management System"
   ```
5. **Create a new Repository on GitHub**:
   - Go to [github.com](https://github.com/) and click **"New Repository"**.
   - Set the repository name (e.g. `kvves`).
   - **Do NOT** check "Add a README file", "Add .gitignore", or "Choose a license" (this prevents branch conflicts).
6. **Link your local repository and push**:
   Copy the commands from the GitHub repository page and run them:
   ```cmd
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## 1. Prerequisites (Must be installed first)

Before installing the project, make sure the following software is installed on the host computer:

### A. Python (v3.10 or higher)
1. Download Python for Windows from [python.org](https://www.python.org/downloads/).
2. Run the installer.
3. > [!IMPORTANT]
   > You **MUST check the box** that says **"Add python.exe to PATH"** before clicking install.
4. Verify by running `python --version` in Command Prompt.

### B. Node.js (v18 or higher LTS)
1. Download Node.js from [nodejs.org](https://nodejs.org/).
2. Run the installer and accept all default settings.
3. Verify by running `node -v` and `npm -v` in Prompt.

### C. Git (Version Control Client)
1. Download Git for Windows from [git-scm.com](https://git-scm.com/download/win).
2. Run the installer and keep all default settings.
3. Verify by running `git --version` in Command Prompt.

### D. Database (Choose Mode)
- **Option 1: SQLite (Default/Local Setup)**: No extra database installation required. Best for single-user desktop deployment.
- **Option 2: PostgreSQL (v14 or higher)**: Required for multi-user network setups. Download from [postgresql.org](https://www.postgresql.org/download/windows/) and set up a database named `kvva_db`.

---

## 2. Clone or Copy Project Files

### Option A: Clone from GitHub (Recommended)
1. Open Command Prompt on the client computer and navigate to the directory where you want to install the app (e.g. `C:\`):
   ```cmd
   cd C:\
   ```
2. Run the clone command to pull the latest codebase:
   ```cmd
   git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git kvves
   ```
3. Navigate into the cloned folder:
   ```cmd
   cd kvves
   ```

### Option B: Copy Files Manually
1. Copy the entire project folder (`kvves`) to the client's system (for example, to `C:\kvves`).

---

## 3. Run First-Time Setup

1. Open the project folder on the client's computer.
2. Navigate to the `scripts` folder.
3. Double-click the [setup.bat](file:///c:/Users/ummer/OneDrive/Desktop/kvva/scripts/setup.bat) script.
4. This script will automatically:
   - Install all Python backend dependencies.
   - Create the `.env` settings file.
   - Run the database migrations.
   - Seed default administrative accounts.
   - Install all frontend dependencies.

---

## 4. Database & Environmental Setup

1. Open the [backend/.env](file:///c:/Users/ummer/OneDrive/Desktop/kvva/backend/.env) file using Notepad.
2. **If using SQLite (Single PC)**:
   - Verify `DEBUG=True` is set (this triggers development mode using SQLite database `db.sqlite3`).
3. **If using PostgreSQL (Network Deployment)**:
   - Change `DEBUG=False` in the `.env` file.
   - Configure the database connection parameters under the `DATABASE` section:
     ```env
     DB_NAME=kvva_db
     DB_USER=your_postgres_username
     DB_PASSWORD=your_postgres_password
     DB_HOST=localhost
     DB_PORT=5432
     ```
   - (Optional) Configure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` with the server's local IP address (e.g. `192.168.1.100`) so that other devices on the same local network (Wi-Fi/LAN) can access the app.

---

## 5. Startup the Application

### Option A: Silent Background Launch (Recommended - No Terminal Windows)
1. Navigate to the `scripts` folder.
2. Double-click [create_shortcut.bat](file:///c:/Users/ummer/OneDrive/Desktop/kvva/scripts/create_shortcut.bat).
3. This creates a shortcut named **"KVVES Management System"** on the Windows Desktop.
4. **How to run**: Simply double-click the desktop shortcut. Both backend and frontend servers will start silently in the background (hidden), and the default web browser will automatically open to the application page:
   **`http://localhost:5173`**

### Option B: Launcher via Terminals (Visible Windows)
1. Navigate to the `scripts` folder.
2. Double-click [start_app.bat](file:///c:/Users/ummer/OneDrive/Desktop/kvva/scripts/start_app.bat).
3. This opens both waitress API and Vite frontend servers in visible Command Prompt windows.
4. Open your web browser and go to:
   **`http://localhost:5173`**

### Login Credentials
Log in with the default seeded administrator credentials:
- **Username**: `admin`
- **Password**: `kvva@admin2024`

---

## 6. Configure Daily Automated Backups

To ensure that client data is protected against hardware failures:

1. Open the `scripts` folder.
2. Right-click on [schedule_backup.bat](file:///c:/Users/ummer/OneDrive/Desktop/kvva/scripts/schedule_backup.bat) and choose **"Run as Administrator"**.
3. Enter the daily backup time in 24hr format (e.g. `20:30` for 8:30 PM).
4. The system will create an automated task in Windows Task Scheduler to back up the database daily.
5. All backups are stored in the `backups/` directory under the root project folder. Old backups (>90 days / 3 months) are pruned automatically.

---

## 7. Setup Backend Auto-Startup (When System is Powered On)

To ensure the backend server runs automatically whenever the host machine is turned on and logged in:

1. Navigate to the `scripts` folder.
2. Right-click on [schedule_startup.bat](file:///c:/Users/ummer/OneDrive/Desktop/kvva/scripts/schedule_startup.bat) and choose **"Run as Administrator"**.
3. This creates a task named `KVVES_Backend_Startup` in the Windows Task Scheduler.
4. **How it runs**: On every system boot/logon, it executes [start_backend_hidden.vbs](file:///c:/Users/ummer/OneDrive/Desktop/kvva/scripts/start_backend_hidden.vbs) which runs the Waitress python server silently in the background (no open terminal window to accidentally close).
