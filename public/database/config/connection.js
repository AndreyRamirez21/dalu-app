const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

// Determinar la ruta correcta según el entorno
let dbPath;

if (app.isPackaged) {
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'dalu.db');
} else {
  dbPath = path.join(app.getPath('userData'), 'dalu.db');
}

console.log('📂 Base de datos en:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err);
  } else {
    console.log('✅ Conectado a SQLite');
  }
});

module.exports = db;