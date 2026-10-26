// JQYDesigns Marketing — proceso principal de Electron.
// Software local: carga la interfaz desde ui/ (nunca una URL remota) y habla
// con el API de la tienda desde este proceso (sin cabecera Origin, para que
// CORS no bloquee las llamadas). El token NUNCA llega al renderer salvo por
// los canales IPC definidos aquí; la contraseña jamás se guarda.
const { app, BrowserWindow, ipcMain, net, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const API_BASE = 'https://api.jqydesigns.com';

let mainWindow = null;
let autoUpdater = null;

// ---------------------------------------------------------------- sesión
// Se guarda SOLO el token y el usuario (nunca la contraseña) en un JSON
// dentro de la carpeta de datos del usuario del sistema operativo.
function sessionPath() {
  return path.join(app.getPath('userData'), 'session.json');
}

let memSession = null; // Sesión solo en memoria (cuando no se marca "Recuérdame")

function loadSession() {
  if (memSession && memSession.token) return memSession;
  try {
    const data = JSON.parse(fs.readFileSync(sessionPath(), 'utf8'));
    return data && data.token ? data : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  try {
    fs.writeFileSync(sessionPath(), JSON.stringify(session), 'utf8');
  } catch {
    // Si no se puede guardar, la sesión vive solo hasta cerrar la app.
  }
}

function clearSession() {
  memSession = null;
  try {
    fs.unlinkSync(sessionPath());
  } catch {
    // No había sesión guardada.
  }
}

// ---------------------------------------------------------------- API
async function apiFetch(pathname, token, options = {}) {
  const url = pathname.startsWith('http')
    ? pathname
    : `${API_BASE}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const init = { ...options, headers };
  // Motor de red de Chromium (el mismo de Chrome): respeta el proxy del
  // sistema y evita bloqueos que el fetch de Node sí sufre en algunas PCs.
  if (net && typeof net.fetch === 'function') {
    try {
      return await net.fetch(url, init);
    } catch {
      // Si la red de Chromium falla, se intenta con el fetch global.
    }
  }
  return fetch(url, init);
}

// ---------------------------------------------------------------- IPC: auth
ipcMain.handle('auth:login', async (_event, credentials) => {
  const { username, password, remember } = credentials || {};
  if (!username || !password) {
    return { ok: false, error: 'Escribe tu usuario y contraseña.' };
  }
  try {
    const loginRes = await apiFetch('/api/auth/login', null, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const loginData = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok || !loginData.token) {
      return { ok: false, status: loginRes.status, error: loginData.message || 'Usuario o contraseña incorrectos.' };
    }

    // Regla del negocio: SOLO entra la cuenta administradora de la página.
    const meRes = await apiFetch('/api/user/me', loginData.token);
    const meData = await meRes.json().catch(() => ({}));
    const user = meData.user || meData;
    if (!meRes.ok || !user || user.role !== 'ADMIN') {
      // No se guarda el token: la sesión queda descartada.
      return { ok: false, status: meRes.status, error: 'Solo la cuenta administradora puede entrar.' };
    }

    const session = { token: loginData.token, username: user.username || username };
    memSession = session;
    if (remember) {
      saveSession(session);
    } else {
      clearSession();
      memSession = session;
    }
    return { ok: true, username: session.username };
  } catch {
    return { ok: false, error: 'Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.' };
  }
});

ipcMain.handle('app:open-recovery', async () => {
  // La recuperación de contraseña vive en la página (flujo ya existente).
  await shell.openExternal('https://jqydesigns.com/admin-login');
  return { ok: true };
});

ipcMain.handle('auth:logout', async () => {
  clearSession();
  return { ok: true };
});

ipcMain.handle('auth:session', async () => {
  const session = loadSession();
  if (!session) return { loggedIn: false };
  return { loggedIn: true, username: session.username };
});

// ---------------------------------------------------------------- IPC: datos
// GET autenticado contra el API. Si el servidor responde 401, la sesión se
// borra y el renderer vuelve a la pantalla de entrada.
ipcMain.handle('api:get', async (_event, pathname) => {
  const session = loadSession();
  if (!session) {
    return { ok: false, status: 401, sessionExpired: true, error: 'Sin sesión activa.' };
  }
  try {
    const res = await apiFetch(pathname, session.token);
    if (res.status === 401) {
      clearSession();
      return { ok: false, status: 401, sessionExpired: true, error: 'Tu sesión venció. Entra de nuevo.' };
    }
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, error: 'Sin conexión con el servidor.' };
  }
});

// ---------------------------------------------------------------- IPC: app / updates
ipcMain.handle('app:version', async () => app.getVersion());

ipcMain.handle('updates:check', async () => {
  if (!autoUpdater) return { ok: false, state: 'unavailable' };
  if (!app.isPackaged) return { ok: false, state: 'dev' };
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true, state: 'checking' };
  } catch {
    return { ok: false, state: 'error' };
  }
});

ipcMain.handle('updates:install', async () => {
  if (autoUpdater && app.isPackaged) autoUpdater.quitAndInstall();
  return { ok: true };
});

function sendUpdateStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updates:status', payload);
  }
}

// electron-updater se carga de forma perezosa: en desarrollo (`electron .`)
// puede no estar instalado y la app debe arrancar igual.
function setupAutoUpdates() {
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch {
    autoUpdater = null;
  }
  if (!autoUpdater || !app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.on('checking-for-update', () => sendUpdateStatus({ state: 'checking' }));
  autoUpdater.on('update-available', (info) =>
    sendUpdateStatus({ state: 'available', version: info && info.version })
  );
  autoUpdater.on('update-not-available', () => sendUpdateStatus({ state: 'none' }));
  autoUpdater.on('download-progress', (progress) =>
    sendUpdateStatus({ state: 'downloading', percent: Math.round(progress.percent || 0) })
  );
  autoUpdater.on('update-downloaded', (info) =>
    sendUpdateStatus({ state: 'downloaded', version: info && info.version })
  );
  autoUpdater.on('error', () => sendUpdateStatus({ state: 'error' }));

  // Revisión automática al abrir el programa (releases de GitHub del repo).
  autoUpdater.checkForUpdates().catch(() => {});
}

// ---------------------------------------------------------------- ventana
function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'JQYDesigns Marketing',
    width: 1280,
    height: 860,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#0a0a0a',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow.show());
  // Interfaz 100% local empaquetada con el programa.
  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
