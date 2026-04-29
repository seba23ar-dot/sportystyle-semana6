// server.js
// Servidor HTTPS para SportyStyle | Actividad semana 6 
// Se utiliza el certificado generado con OpenSSL para cifrar la comunicación

const https = require('https');
const fs    = require('fs');
const path  = require('path');

// 1. CARGAR CERTIFICADO Y CLAVE
// Generados con OpenSSL: cert.pem (certificado) y key.pem (clave privada)
const opciones = {
    key:  fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
    };

// 2. TIPOS DE ARCHIVO QUE PUEDE SERVIR
// El servidor necesita saber qué Content-Type enviar según la extensión
const tiposArchivo = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.ico':  'image/x-icon'
};

// 3. CREAR SERVIDOR HTTPS
const servidor = https.createServer(opciones, (req, res) => {

// Decodificar la URL para manejar rutas con espacios o caracteres especiales
let ruta = decodeURIComponent(req.url === '/' ? '/index.html' : req.url);
let archivo = path.join(__dirname, ruta);

// Leer el archivo solicitado
fs.readFile(archivo, (err, datos) => {
    if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Archivo no encontrado');
        return;
    }

// Detectar el tipo de archivo y responder con el Content-Type correcto
let extension = path.extname(archivo);
let tipo = tiposArchivo[extension] || 'application/octet-stream';

res.writeHead(200, { 'Content-Type': tipo });
res.end(datos);
});
});

// 4. INICIAR SERVIDOR EN EL PUERTO 3000
servidor.listen(3000, () => {
    console.log('Servidor HTTPS corriendo en https://localhost:3000');
});