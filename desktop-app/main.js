const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Prevent multiple instances of the desktop application
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

let mainWindow = null;
let serverInstance = null;
const INTERNAL_PORT = 54321; // Dedicated local loopback port for desktop backend

// Set persistent database path in Windows AppData
const userDataPath = app.getPath('userData');
const dbDir = path.join(userDataPath, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'library.db');
process.env.DB_STORAGE_PATH = dbPath;
process.env.PORT = INTERNAL_PORT;
process.env.NODE_ENV = 'production';
process.env.IS_ELECTRON = 'true';

// Cloud Sync Service
const SyncService = require('./sync-service');
const syncEngine = new SyncService(dbPath);

// Start embedded local Express backend
function startEmbeddedBackend() {
  return new Promise((resolve, reject) => {
    try {
      // Point to backend server in project root (or resources in packaged app)
      const backendServerPath = app.isPackaged
        ? path.join(process.resourcesPath, 'backend', 'server.js')
        : path.join(__dirname, '../backend/server.js');
      
      // Auto-seed default admin and masters on fresh install if DB is empty
      const isFirstLaunch = !fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0;

      // Start the express backend
      require(backendServerPath);

      // Verify server is listening on local port
      const checkInterval = setInterval(() => {
        http.get(`http://127.0.0.1:${INTERNAL_PORT}/api/health`, (res) => {
          if (res.statusCode === 200) {
            clearInterval(checkInterval);
            console.log('✅ Local Embedded Server is healthy on port:', INTERNAL_PORT);

            // If brand-new database, seed initial demo and admin user
            if (isFirstLaunch) {
              try {
                console.log('🔄 First launch detected: seeding initial admin & master data...');
                const seedPath = app.isPackaged
                  ? path.join(process.resourcesPath, 'backend', 'seed.js')
                  : path.join(__dirname, '../backend/seed.js');
                // Run seed script non-destructively
                const { fork } = require('child_process');
                const seedProcess = fork(seedPath, [], {
                  env: { ...process.env, DB_STORAGE_PATH: dbPath }
                });
                seedProcess.on('exit', () => {
                  console.log('✅ Default Admin & Masters seeded successfully into AppData!');
                });
              } catch (seedErr) {
                console.warn('Seed notice:', seedErr.message);
              }
            }
            resolve();
          }
        }).on('error', () => {
          // Waiting for server to initialize
        });
      }, 300);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(); // Continue anyway after 5s
      }, 5000);

    } catch (err) {
      console.error('❌ Failed to start embedded backend:', err);
      reject(err);
    }
  });
}

// Create native desktop window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'India Book House - School Book Allocation & Student Billing',
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: false,
    backgroundColor: '#0f172a',
    show: false
  });

  // Load the application from the local embedded server
  mainWindow.loadURL(`http://127.0.0.1:${INTERNAL_PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle handlers
app.whenReady().then(async () => {
  try {
    await startEmbeddedBackend();
    createMainWindow();
  } catch (err) {
    dialog.showErrorBox('Startup Error', `Could not initialize desktop application: ${err.message}`);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for Cloud Sync
ipcMain.handle('get-sync-status', async () => {
  return await syncEngine.getStatus();
});

ipcMain.handle('trigger-cloud-sync', async (event, customCloudUrl) => {
  return await syncEngine.syncAll(customCloudUrl);
});
