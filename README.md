# SportyStyle – Tienda de ropa deportiva

**Asignatura:** Taller de Plataformas Web – CIB302 
**Estudiante:** Sebastian Alvarez | CIB302-3903 | Actividad semana 6

---

## 📁 Estructura del Proyecto
SportyStyle/
├── index.html ← Estructura HTML de la tienda
├── server.js ← Servidor HTTPS con Node.js
├── cert.pem ← Certificado SSL generado con OpenSSL
├── key.pem ← Clave privada generada con OpenSSL
├── README.md ← Documentación del proyecto
├── css/
│ └── estilos.css ← Estilos visuales y componentes
├── js/
│ └── app.js ← Lógica JavaScript: productos, carrito, Auth0
└── img/
└── (imágenes de productos)

---

## 1. Flujo de Autenticación con Auth0

SportyStyle delega toda la autenticación al **Auth0 SPA SDK v2**, que implementa el flujo **Authorization Code + PKCE** recomendado por OAuth 2.0 para aplicaciones de una sola página.

### ¿Por qué Auth0 y no un sistema propio?
Construir autenticación propia requeriría hashear contraseñas, gestionar tokens JWT manualmente y proteger contra ataques de fuerza bruta. Auth0 implementa todo esto de forma segura y automática, reduciendo el riesgo de errores en la implementación.

### Paso a paso del flujo:
Usuario hace clic en "Iniciar Sesión"
↓

loginWithRedirect() redirige a login.auth0.com
↓

Usuario ingresa credenciales en Auth0 (NUNCA en nuestro sitio)
↓

Auth0 redirige de vuelta con ?code= en la URL
↓

handleRedirectCallback() procesa el código y obtiene el token
↓

window.history.replaceState() limpia ?code= de la URL
↓

getUser() obtiene los datos del usuario autenticado
↓

Se muestra "👋 Hola, [nombre]" en el navbar

### Autenticación requerida para comprar:
Al hacer clic en "Ir a Pagar", la aplicación verifica si el usuario está autenticado. Si no lo está, lo redirige automáticamente al login de Auth0 antes de continuar con el checkout.

### Cierre de sesión:
Al hacer clic en "Cerrar Sesión":
1. Se limpia el `sessionStorage` (elimina el carrito)
2. `auth0Client.logout()` invalida la sesión en Auth0
3. El usuario es redirigido de vuelta a la página principal

---

## 2. Proceso de Selección de Productos y Carrito

### Catálogo
La tienda ofrece **9 productos** en 3 categorías definidas en el objeto `PRODUCTS` dentro de `app.js`:

| Categoría             | Productos                       | Rango de precio   |
|-----------------------|---------------------------------|-------------------|
| Camisetas Deportivas  | Dri-Fit, Running, Gym Classic   | $9.990 – $14.990  |
| Pantalones Deportivos | Jogger, Shorts Running, Legging | $13.490 – $19.990 |
| Accesorios de Deporte | Guantes, Botella Termo, Mochila | $8.990 – $24.990  |

### Flujo de agregar al carrito:
renderProducts() genera las tarjetas en el DOM
↓

Usuario hace clic en "Agregar al carrito"
↓

addToCart(id, cat, btn) busca el producto en PRODUCTS
↓

Si ya existe → aumenta qty | Si no existe → lo agrega
↓

saveCart() guarda el array con JSON.stringify en sessionStorage
↓

renderCart() actualiza el contador y la lista del carrito
↓

El botón muestra "✅ Agregado" por 1.2 segundos como confirmación


---

## 3. Protección de la Sesión con Session Storage

### ¿Por qué Session Storage y no Local Storage?

| Característica                    | sessionStorage                        | localStorage                            |
|-----------------------------------|---------------------------------------|-----------------------------------------|
| Duración                          | Solo mientras la pestaña está abierta | Persiste indefinidamente                |
| Riesgo en equipo compartido       | Bajo: se borra al cerrar pestaña      | Alto: otro usuario puede ver el carrito |
| Adecuado para carrito temporal    |              ✅Sí                     |          ❌ No ideal                   |

### Datos almacenados:
```javascript
// Clave: "sportyStyleCart"
// Valor: array JSON con estructura:
[
  { id: "c1", nombre: "Camiseta Dri-Fit", precio: 14990, qty: 2 },
  { id: "a2", nombre: "Botella Termo",    precio: 11990, qty: 1 }
]
```

**Los Datos que NO se almacenan:** contraseñas, tokens JWT, datos de tarjeta ni información personal del formulario.

### Cuándo se limpia el storage:

| Evento                                       | Acción                                             |
|----------------------------------------------|----------------------------------------------------|
| Usuario finaliza la compra (`finishOrder()`) | `clearCart()` + reset del formulario               |
| Usuario cierra sesión (`logout()`)           | `clearCart()` antes del redirect a Auth0           |
| Usuario cierra la pestaña                    | El navegador elimina sessionStorage automáticamente|

---

## 4. Seguridad Implementada

### Sanitización XSS
Todos los datos externos pasan por `sanitize()` antes de insertarse en el DOM con `innerHTML`. Esta función reemplaza los caracteres peligrosos `& < > " ' /` por sus entidades HTML equivalentes, previniendo ataques de Cross-Site Scripting.

### Validaciones del formulario

| Campo    | Validaciones aplicadas                                                    |
|----------|---------------------------------------------------------------------------|
| Nombre   | Mínimo 3 caracteres, máximo 80                                            |
| Dirección| Mínimo 5 caracteres, no puede ser solo números                            |
| Email    | Formato con @ y dominio, máximo 100 caracteres, validación en tiempo real |
| Teléfono | Solo dígitos, entre 8 y 12 números                                        |

---

## 5. Servidor HTTPS y Certificado SSL

### ¿Por qué HTTPS y no HTTP?
HTTP transmite los datos en texto plano, lo que significa que cualquiera que intercepte la conexión puede leer la información. 
Por lo contrario HTTPS cifra toda la comunicación entre el navegador y el servidor usando el protocolo **TLS**, protegiendo de esta manera los datos del usuario.

### ¿Qué es OpenSSL?
OpenSSL es una herramienta que permite generar certificados digitales. En este proyecto se usó para crear un certificado auto-firmado, suficiente para desarrollo local y para demostrar el funcionamiento de HTTPS.

### Comando utilizado:
```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

| Parámetro               | Significado |
|-------------------------|-------------------------------------------------------|
| `req -x509`             | Genera un certificado auto-firmado                    |
| `-newkey rsa:2048`      | Crea una nueva clave RSA de 2048 bits                 |
| `-keyout key.pem`       | Guarda la clave privada en `key.pem`                  |
| `-out cert.pem`         | Guarda el certificado en `cert.pem`                   |
| `-days 365`             | El certificado es válido por 1 año                    |
| `-nodes`                | No encripta la clave privada (para uso en desarrollo) |
| `-subj "/CN=localhost"` | El certificado es válido para el dominio `localhost`  |

### Cómo lo usa server.js:
```javascript
const opciones = {
  key:  fs.readFileSync('key.pem'),   // clave privada
  cert: fs.readFileSync('cert.pem')   // certificado
};
const servidor = https.createServer(opciones, ...);
servidor.listen(3000);
```
Node.js usa estos archivos para cifrar la conexión. Los datos del formulario (nombre, dirección, email, teléfono) viajan encriptados entre el navegador y el servidor.

### Relación con Auth0:
Auth0 requiere HTTPS para funcionar correctamente. El protocolo OAuth 2.0 exige conexiones seguras para proteger el intercambio de tokens de autenticación.

---

## 6. Cómo Ejecutar el Proyecto

### Opcion 1: Con servidor HTTPS 

**Requisito previo:** tener Node.js instalado.

**Paso 1 — Generar el certificado SSL:**
```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
```

**Paso 2 — Iniciar el servidor:**
```bash
node server.js
```

**Paso 3 — Abrir en el navegador:**
https://localhost:3000


> El navegador mostrará una advertencia de seguridad porque el certificado es auto-firmado.
> Haz clic en **Opciones avanzadas → Continuar a localhost**. 

### Con Live Server (modo demo sin HTTPS)
1. Abrir la carpeta en Visual Studio Code
2. Hacer clic derecho en `index.html` → **"Open with Live Server"**
3. La app corre en `http://127.0.0.1:5500`

---

## 7. Tecnologías Utilizadas

| Tecnología      | Versión | Uso                                                  |
|-----------------|---------|------------------------------------------------------|
| HTML5           |    —    | Estructura semántica de la tienda                    |
| CSS3            |    —    | Diseño responsive, variables, Flexbox, Grid          |
| JavaScript      |   ES6+  | Lógica del carrito, validaciones, Auth0, async/await |
| Node.js         |    —    | Servidor HTTPS con módulo `https` nativo             |
| OpenSSL         |   4.0   | Generación del certificado SSL auto-firmado          |
| Auth0 SPA SDK   |   v2.0  | Autenticación OAuth 2.0 con PKCE                     |
| Session Storage | Web API | Persistencia temporal del carrito                    |

---

*Desarrollado por **Sebastian Alvarez** · CIB302-3903 · Actividad semana 6*