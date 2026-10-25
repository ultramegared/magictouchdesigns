const { app, BrowserWindow } = require("electron");
const path = require("path");

// JQYDesigns Marketing para PC: ventana del panel en vivo.
// El panel vive en el servidor, asi que la app siempre muestra la version
// mas reciente sin necesidad de actualizar el programa.
const PANEL_URL = "https://www.jqydesigns.com/admin/marketing";

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "JQYDesigns Marketing",
        icon: path.join(__dirname, "build", "icon.ico"),
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    win.maximize();
    win.loadURL(PANEL_URL);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
