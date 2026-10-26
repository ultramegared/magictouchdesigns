// Puente seguro entre la interfaz (renderer) y el proceso principal.
// La interfaz nunca toca Node ni hace fetch: todo pasa por estos métodos.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Autenticación (solo cuenta administradora; verificado en main.js)
  login: (username, password, remember) => ipcRenderer.invoke('auth:login', { username, password, remember: !!remember }),
  openRecovery: () => ipcRenderer.invoke('app:open-recovery'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  session: () => ipcRenderer.invoke('auth:session'),

  // Datos del panel (GET autenticados contra el API de la tienda)
  apiGet: (pathname) => ipcRenderer.invoke('api:get', pathname),

  // Versión y actualización automática
  version: () => ipcRenderer.invoke('app:version'),
  checkUpdates: () => ipcRenderer.invoke('updates:check'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('updates:status', listener);
    return () => ipcRenderer.removeListener('updates:status', listener);
  },
});
