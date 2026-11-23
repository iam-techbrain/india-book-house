const { contextBridge, ipcRenderer } = require('electron');

// Expose secure API bridge to frontend
contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  platform: process.platform,
  getSyncStatus: () => ipcRenderer.invoke('get-sync-status'),
  triggerCloudSync: (cloudUrl) => ipcRenderer.invoke('trigger-cloud-sync', cloudUrl)
});
