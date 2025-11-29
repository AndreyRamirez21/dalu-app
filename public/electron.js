const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Determinar si estamos en desarrollo o producción
  const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || /[\\/]electron/.test(process.execPath);

  if (isDev) {
    // Modo desarrollo: cargar desde localhost
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Modo producción: cargar el archivo HTML compilado
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file:',
        slashes: true
      })
    );
  }

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Failed to load, trying alternative path...');
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});