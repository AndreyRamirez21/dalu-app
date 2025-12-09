const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const https = require('https');

const API_URL = 'https://dalu-backup-api.onrender.com'; // ← TU URL DE RENDER
const BUSINESS_ID = 'dalu-local';

class BackupService {
  constructor(dbPath) {
    this.dbPath = dbPath;
  }

  async crearBackup() {
    try {
      console.log('📤 Iniciando backup...');

      if (!fs.existsSync(this.dbPath)) {
        throw new Error('Base de datos no encontrada');
      }

      const dbBuffer = fs.readFileSync(this.dbPath);
      const dbSize = (dbBuffer.length / 1024 / 1024).toFixed(2);
      console.log(`📊 Tamaño de DB: ${dbSize} MB`);

      const form = new FormData();
      form.append('database', dbBuffer, {
        filename: 'dalu.db',
        contentType: 'application/x-sqlite3'
      });
      form.append('businessId', BUSINESS_ID);

      const result = await this.uploadToAPI(form);
      console.log('✅ Backup completado:', result);

      return {
        success: true,
        message: 'Backup creado exitosamente',
        fileName: result.fileName,
        size: result.size,
        timestamp: result.timestamp
      };

    } catch (error) {
      console.error('❌ Error al crear backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  uploadToAPI(form) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${API_URL}/api/backup/upload`);

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: form.getHeaders()
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Error ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      form.pipe(req);
    });
  }

  async listarBackups() {
    try {
      const url = `${API_URL}/api/backup/list?businessId=${BUSINESS_ID}`;

      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              if (result.success) {
                resolve(result.backups);
              } else {
                reject(new Error(result.error));
              }
            } catch (error) {
              reject(error);
            }
          });
        }).on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Error al listar backups:', error);
      return [];
    }
  }

  async restaurarBackup(fileName) {
    try {
      console.log('📥 Descargando backup:', fileName);

      const url = `${API_URL}/api/backup/download/${fileName}`;

      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          const chunks = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            try {
              const buffer = Buffer.concat(chunks);

              // Crear backup del archivo actual
              const backupPath = this.dbPath + '.backup';
              if (fs.existsSync(this.dbPath)) {
                fs.copyFileSync(this.dbPath, backupPath);
              }

              // Guardar el nuevo archivo
              fs.writeFileSync(this.dbPath, buffer);

              console.log('✅ Backup restaurado exitosamente');
              resolve({
                success: true,
                message: 'Base de datos restaurada exitosamente'
              });
            } catch (error) {
              reject(error);
            }
          });
        }).on('error', (error) => {
          reject(error);
        });
      });

    } catch (error) {
      console.error('❌ Error al restaurar backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  iniciarBackupAutomatico(intervaloHoras = 24) {
    console.log(`⏰ Backup automático configurado cada ${intervaloHoras} horas`);

    // Backup inicial después de 5 minutos
    setTimeout(() => {
      this.crearBackup();
    }, 5 * 60 * 1000);

    // Programar backups periódicos
    setInterval(() => {
      this.crearBackup();
    }, intervaloHoras * 60 * 60 * 1000);
  }
}

module.exports = BackupService;