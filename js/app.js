// SportyStyle – app.js
// Actividad semana 6  


// 1. CONFIGURACIÓN AUTH0
const AUTH0_CONFIG = {
  domain:   "dev-lzxkdqni81koszff.us.auth0.com",
  clientId: "ZuchTPP6NWxNoQ0pDpqepTCRqyWxOvaY",
  authorizationParams: {
    redirect_uri: window.location.origin + window.location.pathname
  }
};

let auth0Client = null;


// 2. SANITIZACIÓN XSS 
// Se reemplaza caracteres peligrosos para prevenir inyección de código en el DOM 
function sanitize(str) {
  const map = {
    "&":  "&amp;",
    "<":  "&lt;",
    ">":  "&gt;",
    '"':  "&quot;",
    "'":  "&#x27;",
    "/":  "&#x2F;"
  };
  return String(str).replace(/[&<>"'/]/g, ch => map[ch]);
}


// 3. CATÁLOGO DE PRODUCTOS 
const PRODUCTS = {
  camisetas: [
    {
      id: "c1",
      nombre: "Camiseta Dri-Fit",
      descripcion: "Fabricada con tejido de alto rendimiento que evacúa el sudor hacia el exterior, manteniéndote seco y fresco durante toda la sesión. Corte ergonómico para mayor libertad de movimiento.",
      precio: 14990,
      img: "img/dri-fit.jpg"
    },
    {
      id: "c2",
      nombre: "Camiseta Running",
      descripcion: "Ultraligera y transpirable, diseñada para corredores que exigen lo mejor. Su tejido de secado rápido y costuras planas evitan las rozaduras en entrenamientos largos al aire libre.",
      precio: 12490,
      img: "img/Polerarunning.jpg"
    },
    {
      id: "c3",
      nombre: "Camiseta Gym Classic",
      descripcion: "Confeccionada en algodón premium de corte recto y amplio. Perfecta para sesiones de pesas o entrenamiento funcional donde necesitas comodidad y estilo sin complicaciones.",
      precio: 9990,
      img: "img/gymclassic.jpg"
    }
  ],
  pantalones: [
    {
      id: "p1",
      nombre: "Pantalón Jogger",
      descripcion: "Tejido elástico en 4 direcciones con cintura ajustable y bolsillos laterales con cierre. Combina comodidad y estilo para cardio, crossfit o uso casual después del entrenamiento.",
      precio: 19990,
      img: "img/jogger.jpg"
    },
    {
      id: "p2",
      nombre: "Shorts Running",
      descripcion:  "Diseño de doble capa con licra interior integrada para mayor soporte. Material de secado ultrarrápido y corte aerodinámico que garantiza total libertad de movimiento en cada zancada.",
      precio: 13490,
      img: "img/running.jpg"
    },
    {
      id: "p3",
      nombre: "Legging Compresión",
      descripcion: "Alta compresión muscular graduada que mejora la circulación sanguínea durante el ejercicio y acelera la recuperación post-entrenamiento. Tejido muy resistente con cintura alta.",
      precio: 17990,
      img: "img/legging.jpg"
    }
  ],
  accesorios: [
    {
      id: "a1",
      nombre: "Guantes Powerlifting",
      descripcion:  "Palma de cuero sintético acolchada con gel antideslizante y muñequera de soporte integrada. Protegen las manos, mejoran el agarre y reducen la fatiga en series de alto volumen.",
      precio: 8990,
      img: "img/guantes1.jpg"
    },
    {
      id: "a2",
      nombre: "Botella Termo",
      descripcion:  "Fabricada en acero inoxidable de doble pared al vacío. Mantiene tus bebidas frías hasta 24 horas o calientes hasta 12 horas. Incluye asa plegable y tapa hermética antigoteo.",
      precio: 11990,
      img: "img/botella.jpg"
    },
    {
      id: "a3",
      nombre: "Mochila Sport",
      descripcion: "Mochila técnica con compartimento acolchado para laptop de hasta 15 pulgadas, bolsillo húmedo independiente para ropa de entrenamiento y correas ergonómicas con espaldar ventilado.",
      precio: 24990,
      img: "img/mochila2.jpg"
    }
  ]
};


// 4. SESSION STORAGE  
// Se usa sessionStorage en vez de localStorage porque el carrito es temporal por sesión 
// localStorage persistiría entre sesiones y podría exponer datos de otro usuario en un equipo compartido
const CART_KEY = "sportyStyleCart";
// try/catch por si los datos del sessionStorage están dañados o vacíos
// Array.isArray() asegura que siempre se devuelva una lista válida
function getCart() {
  try {
    const data = JSON.parse(sessionStorage.getItem(CART_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("Session Storage corrupto, reiniciando carrito:", e.message);
    sessionStorage.removeItem(CART_KEY);
    return [];
  }
}

function saveCart(cart) { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function clearCart()    { sessionStorage.removeItem(CART_KEY); }


// 5. RENDERIZAR PRODUCTOS en el DOM 
function renderProducts() {
  ["camisetas", "pantalones", "accesorios"].forEach(cat => {
    const container = document.getElementById(cat);
// sanitize() en cada campo para prevenir XSS al insertar en innerHTML
// onerror en img: si la ruta falla, muestra imagen de reemplazo
    container.innerHTML = PRODUCTS[cat].map(p => `
      <article class="product-card">
        <img src="${sanitize(p.img)}"
            alt="${sanitize(p.nombre)}"
            loading="lazy"
            onerror="this.src='https://placehold.co/400x200?text=Imagen+no+disponible';this.onerror=null" />
        <div class="card-body">
          <h3>${sanitize(p.nombre)}</h3>
          <p>${sanitize(p.descripcion)}</p>
          <span class="price">$${p.precio.toLocaleString("es-CL")}</span>
          <button class="btn-add" onclick="addToCart('${sanitize(p.id)}','${cat}',this)">
            Agregar al carrito
          </button>
        </div>
      </article>
    `).join("");
  });
}


// 6. Carrito de compras
// Agrega un producto al carrito o aumenta su cantidad si ya existe
// Se recibe el botón directamente para cambiar su texto como confirmación visual
function addToCart(id, cat, btn) {
  try {
    const cart = getCart();
    const idx  = cart.findIndex(x => x.id === id);
    if (idx >= 0) {
      cart[idx].qty++; 
    } else {
      const p = PRODUCTS[cat]?.find(x => x.id === id);
      if (!p) throw new Error(`Producto ${id} no encontrado en categoría ${cat}`);
      cart.push({ id: p.id, nombre: p.nombre, precio: p.precio, qty: 1 });
    }
    saveCart(cart);
    renderCart();
// Feedback visual directo en el botón presionado
    if (btn) {
      btn.textContent = "✅ Agregado";
      setTimeout(() => { btn.textContent = "Agregar al carrito"; }, 1200);
    }
  } catch (err) {
    console.error("Error al agregar al carrito:", err.message);
    alert("No se pudo agregar el producto. Intenta nuevamente.");
  }
}

function changeQty(id, delta) {
  const cart = getCart();
  const idx  = cart.findIndex(x => x.id === id);
  if (idx < 0) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
}

function renderCart() {
  const cart  = getCart();
  const count = cart.reduce((s, x) => s + x.qty, 0);
  const total = cart.reduce((s, x) => s + x.precio * x.qty, 0);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-total").textContent = total.toLocaleString("es-CL");

  const container = document.getElementById("cart-items");
  if (cart.length === 0) {
    container.innerHTML = "<p style='color:#636e72;font-size:.9rem;text-align:center;padding:20px 0'>Tu carrito está vacío.</p>";
    return;
  }
// sanitize() en nombre e id antes de insertar en DOM
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <strong>${sanitize(item.nombre)}</strong><br/>
        <span>$${item.precio.toLocaleString("es-CL")} × ${item.qty}</span>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" onclick="changeQty('${sanitize(item.id)}',-1)">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${sanitize(item.id)}',1)">+</button>
      </div>
    </div>
  `).join("");
}

// Abre o cierra el panel del carrito lateral
function toggleCart() {
  const panel   = document.getElementById("cart-panel");
  const overlay = document.getElementById("cart-overlay");
  const abriendo = panel.classList.contains("hidden");

  panel.classList.toggle("hidden");
  overlay.classList.toggle("hidden");

  if (abriendo) {
    panel.classList.add("slide-in");
    document.body.style.overflow = "hidden";
  } else {
    panel.classList.remove("slide-in");
    document.body.style.overflow = ""; 
  }
}

// Cierra el carrito y desplaza la pagina hasta la seccion de productos
function keepShopping() {
  const panel   = document.getElementById("cart-panel");
  const overlay = document.getElementById("cart-overlay");
  panel.classList.add("hidden");
  panel.classList.remove("slide-in");
  overlay.classList.add("hidden");
  document.querySelector("main.container").scrollIntoView({ behavior: "smooth" });
}


// 7. Checkout  
async function goToCheckout() { 
// Verificar si el usuario está autenticado antes de continuar
  if (auth0Client) {
    const isAuth = await auth0Client.isAuthenticated();
    if (!isAuth) {
      alert("⚠️ Debes iniciar sesión para continuar con tu compra.");
      await auth0Client.loginWithRedirect();
      return;
    }
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert("⚠️ Tu carrito está vacío. Agrega al menos un producto.");
    return;
  }

  const total = cart.reduce((s, x) => s + x.precio * x.qty, 0);

  document.getElementById("checkout-summary").innerHTML = `
    <table class="summary-table">
      <thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${cart.map(i => `
          <tr>
            <td>${sanitize(i.nombre)}</td>
            <td>${i.qty}</td>
            <td>$${(i.precio * i.qty).toLocaleString("es-CL")}</td>
          </tr>`).join("")}
        <tr>
          <td colspan="2"><strong>Total</strong></td>
          <td><strong>$${total.toLocaleString("es-CL")}</strong></td>
        </tr>
      </tbody>
    </table>`;

// Cierra carrito antes de abrir modal
  document.getElementById("cart-panel").classList.add("hidden");
  document.getElementById("cart-panel").classList.remove("slide-in");
  document.getElementById("cart-overlay").classList.add("hidden");
  document.getElementById("checkout-modal").classList.remove("hidden");
}


// 8. VALIDACIÓN DE FORMULARIO
// Se valida cada campo antes de procesar el pedido
function submitOrder(e) {
  e.preventDefault();
  let valid = true;

  const name    = document.getElementById("f-name").value.trim();
  const address = document.getElementById("f-address").value.trim();
  const email   = document.getElementById("f-email").value.trim();
  const phone   = document.getElementById("f-phone").value.trim();

// Limpiar mensajes de error anteriores
  ["err-name","err-address","err-email","err-phone"].forEach(id => {
    document.getElementById(id).textContent = "";
  });

// Validación de largo máximo para evitar datos incorrectos en el formulario
  if (name.length > 80) {
    document.getElementById("err-name").textContent = "El nombre no puede superar 80 caracteres.";
    valid = false;
  }
  if (email.length > 100) {
    document.getElementById("err-email").textContent = "El correo no puede superar 100 caracteres.";
    valid = false;
  }

// Una direccion válida siempre tiene letras, no puede ser solo números
  if (/^\d+$/.test(address)) {
    document.getElementById("err-address").textContent = "Ingresa una dirección válida (ej: Av. Los Leones 123).";
    valid = false;
  }

// Validación nombre mínimo 3 caracteres
  if (name.length < 3) {
    document.getElementById("err-name").textContent = "Ingresa tu nombre completo (mín. 3 caracteres).";
    valid = false;
  }

// Validación dirección mínimo 5 caracteres
  if (address.length < 5) {
    document.getElementById("err-address").textContent = "Ingresa una dirección válida.";
    valid = false;
  }

// Validación formato email debe tener @ y dominio
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById("err-email").textContent = "Formato inválido. Ej: nombre@gmail.com";
    valid = false;
  }

// Validación teléfono: solo dígitos, 8-12 números
  const phoneRegex = /^\d{8,12}$/;
  if (!phoneRegex.test(phone)) {
    document.getElementById("err-phone").textContent = "Solo dígitos, entre 8 y 12 números.";
    valid = false;
  }

  if (!valid) return;

// Mostrar confirmación sanitizando datos del usuario antes de insertar en DOM
  const cart  = getCart();
  const total = cart.reduce((s, x) => s + x.precio * x.qty, 0);

  document.getElementById("confirm-name").textContent =
    `¡Hola, ${name}! Hemos recibido con éxito tu pedido. 🎉`;

  document.getElementById("confirm-details").innerHTML = `
    <table class="summary-table" style="text-align:left; margin: 12px auto;">
      <thead><tr><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${cart.map(i => `
          <tr>
            <td>${sanitize(i.nombre)}</td>
            <td>${i.qty}</td>
            <td>$${(i.precio*i.qty).toLocaleString("es-CL")}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    <p style="margin:8px 0 4px"><strong>Dirección:</strong> ${sanitize(address)}</p>
    <p><strong>Correo:</strong> ${sanitize(email)}</p>
    <p><strong>Teléfono:</strong> ${sanitize(phone)}</p>`;

  document.getElementById("confirm-total").innerHTML =
    `<strong>Total pagado: $${total.toLocaleString("es-CL")}</strong>`;

  document.getElementById("checkout-modal").classList.add("hidden");
  document.getElementById("confirm-modal").classList.remove("hidden");
}
// Limpia Session Storage al finalizar compra
function finishOrder() {
  clearCart();         
  renderCart();
  closeModal("confirm-modal");
  document.getElementById("checkout-form").reset();
}

// Cierra el modal, limpia el form y reabre el carrito si venía del checkout
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
  if (id === "checkout-modal") {
    document.getElementById("checkout-form").reset();
    ["err-name","err-address","err-email","err-phone"].forEach(errId => {
      document.getElementById(errId).textContent = "";
    });
// Vuelve a mostrar el carrito al cerrar el checkout
    document.getElementById("cart-panel").classList.remove("hidden");
    document.getElementById("cart-panel").classList.add("slide-in");
    document.getElementById("cart-overlay").classList.remove("hidden");
  }
}


// 9. AUTH0 – AUTENTICACIÓN 
// Se usa Auth0 para gestionar el inicio de sesión de forma segura
// Auth0 maneja los tokens y contraseñas internamente sin que el desarrollador los vea
async function initAuth0() {
  try {
    auth0Client = await auth0.createAuth0Client(AUTH0_CONFIG);

// Si Auth0 redirigió de vuelta con ?code= en la URL, procesamos el callback
    if (location.search.includes("code=") || location.search.includes("error=")) {
      await auth0Client.handleRedirectCallback();
// Limpia ?code= de la URL sin recargar la página
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    await updateAuthUI();
  } catch (err) {
    console.warn("Auth0 no configurado o error al inicializar:", err.message);
    }
}

async function updateAuthUI() {
  if (!auth0Client) return;
  const isAuth = await auth0Client.isAuthenticated();

  // Muestra u oculta los botones según si el usuario está autenticado o no
  document.getElementById("btn-login").classList.toggle("hidden",  isAuth);
  document.getElementById("btn-logout").classList.toggle("hidden", !isAuth);
  document.getElementById("welcome-msg").classList.toggle("hidden", !isAuth);

  if (isAuth) {
    const user = await auth0Client.getUser();
    const displayName = sanitize(user.given_name || user.name || user.email || "usuario");
    document.getElementById("welcome-msg").textContent = `👋 Hola, ${displayName}`;
  }
}

async function login() {
  if (auth0Client) {
    await auth0Client.loginWithRedirect();
  } else {
    alert("⚠️ Auth0 no está configurado correctamente.");
  }
}

async function logout() {
// Al cerrar sesión se limpia el carrito del sessionStorage
  clearCart();
  renderCart();
  if (auth0Client) {
    await auth0Client.logout({ logoutParams: { returnTo: window.location.origin  + window.location.pathname } });
  } else {
    document.getElementById("btn-login").classList.remove("hidden");
    document.getElementById("btn-logout").classList.add("hidden");
    document.getElementById("welcome-msg").classList.add("hidden");
  }
}


// 10. INICIALIZACIÓN 
// Se espera a que el HTML cargue completamente antes de ejecutar el código
window.addEventListener("DOMContentLoaded", async () => {
  renderProducts();   
  renderCart();       
  await initAuth0();  

// Tecla Escape cierra carrito y modales abiertos
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.getElementById("cart-panel").classList.add("hidden");
      document.getElementById("cart-panel").classList.remove("slide-in");
      document.getElementById("cart-overlay").classList.add("hidden");
      document.getElementById("checkout-modal").classList.add("hidden");
    }
  });

// Muestra un aviso si el email tiene formato incorrecto mientras el usuario escribe
  document.getElementById("f-email")?.addEventListener("input", (e) => {
    const val        = e.target.value.trim();
    const errEl      = document.getElementById("err-email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    errEl.textContent = (val.length > 0 && !emailRegex.test(val))
      ? "⚠️ Formato de correo inválido"
      : "";
  });

// Si el cliente hace clic en el fondo oscuro fuera del modal lo cierra
  document.getElementById("checkout-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      closeModal("checkout-modal");
    }
  });
});
