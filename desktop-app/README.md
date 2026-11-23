# India Book House LMS - Desktop Application
### 100% Offline Desktop Software with 1-Click Cloud Sync (Electron.js)

---

## Overview
 
The `desktop-app` directory contains the standalone **Electron.js Desktop Application** for **India Book House LMS**. It bundles the React frontend, Express backend, and embedded SQLite database into a single, offline-capable Windows software (`.exe`).

### Key Capabilities:
- **100% Offline**: Works in airplane mode or remote school camps. No Wi-Fi or cloud server connection required.
- **High Capacity**: Handles 2,000 to 5,000+ student rosters, Excel bulk uploads, and real-time fee calculations smoothly.
- **Zero Configuration**: SQLite database is embedded. No external database software installation required on client PCs.
- **Two-Way Cloud Sync**: Built-in sync engine connects to your central online server (`/api/sync/*`) to push offline collections and pull master price lists.
- **Safe AppData Storage**: Database is stored in Windows user directory (`%APPDATA%/india-book-house-desktop/data/library.db`), surviving software updates.

---

## Quick Start (Developer Setup)

### 1. Install Dependencies
Open terminal in the `desktop-app` directory:
```bash
cd desktop-app
npm install
```

### 2. Run in Development Mode
```bash
npm start
```
This automatically boots the embedded local backend on `127.0.0.1:54321`, mounts the local SQLite database, and opens the native desktop window.

---

## How to Build the Windows Installer (.exe)

Run the build command in the `desktop-app` directory:

```bash
npm run dist
```

This compiles everything into self-contained Windows executables inside `dist-build/`:
1. **`India Book House LMS Setup 1.0.0.exe`** (Standard Windows Installer - recommend for clients)
2. **`India Book House LMS 1.0.0.exe`** (Portable version - runs without installation)

---

## How Clients Install and Use the Application

Clients do not need any technical setup, terminal commands, or Node.js installed:

1. Send the `India Book House LMS Setup 1.0.0.exe` file to the client.
2. The client double-clicks the setup file.
3. Clicks **Next** -> **Install** -> **Finish**.
4. An **India Book House LMS** shortcut icon is created on their Desktop and Start Menu.
5. The software runs completely offline at native speed.

---

## Cloud Synchronization Architecture

```text
+--------------------------------------------------------+
|                   School Camp Laptop                   |
|                                                        |
|  [ React Frontend ] <---> [ Local Express Backend ]    |
|                                  |                     |
|                        [ Local SQLite DB ]             |
|                     (2,000 - 5,000 Students)           |
+--------------------------------------------------------+
                            |
                 [ 1-Click Cloud Sync ]
           (When Wi-Fi / Hotspot is connected)
                            |
+--------------------------------------------------------+
|                  Central Cloud Server                  |
|               http://YOUR_SERVER_IP:5000               |
|                                                        |
|  - Real-Time Head Office Audit                         |
|  - Multi-School Camp Revenue Reports                   |
|  - Master Inventory & Price Updates                    |
+--------------------------------------------------------+
```

---

## File Structure

```text
desktop-app/
├── assets/
│   └── icon.png          # High-resolution application icon
├── dist-build/           # Generated Windows installer (.exe) files (git-ignored)
├── main.js               # Electron main process & local backend runner
├── preload.js            # Secure IPC communication bridge
├── sync-service.js       # Two-way Cloud Synchronization Engine
├── package.json          # Electron & electron-builder packaging configuration
├── .gitignore            # Git exclusion rules for large .exe binaries
└── README.md             # Desktop software documentation
```
