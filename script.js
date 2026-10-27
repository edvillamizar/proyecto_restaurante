// ---------- Slider principal ----------
// Si la CDN de Swiper falla, el resto del script debe seguir funcionando
if (typeof Swiper !== "undefined") {
  new Swiper(".mySwiper-1", {
    slidesPerView: 1,
    spaceBetween: 30,
    rewind: true,
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });
}

// ---------- Carta filtrable ----------
const filtros = document.querySelectorAll(".filtro");
const productos = document.querySelectorAll(".carta-grid .product");

filtros.forEach((btn) => {
  btn.addEventListener("click", () => {
    const categoria = btn.dataset.filtro;
    filtros.forEach((b) => {
      const activo = b === btn;
      b.classList.toggle("activo", activo);
      b.setAttribute("aria-pressed", String(activo));
    });
    productos.forEach((p) => {
      p.hidden = categoria !== "todos" && p.dataset.categoria !== categoria;
    });
  });
});

// ---------- Pedido por WhatsApp ----------
// Sustituye por tu número de móvil (prefijo país, sin + ni espacios) para probarlo.
const WHATSAPP_NUMERO = "34600000000";

const euros = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const pedido = new Map(); // id -> { nombre, precio, cantidad }

const listaEl = document.getElementById("pedido-lista");
const vacioEl = document.getElementById("pedido-vacio");
const totalEl = document.getElementById("pedido-total");
const enviarEl = document.getElementById("pedido-enviar");

function totalPedido() {
  let total = 0;
  pedido.forEach((i) => (total += i.precio * i.cantidad));
  return total;
}

function cambiarCantidad(id, delta) {
  const item = pedido.get(id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) pedido.delete(id);
  renderPedido();
}

function renderPedido() {
  listaEl.replaceChildren();
  pedido.forEach((item, id) => {
    const li = document.createElement("li");

    const texto = document.createElement("span");
    texto.textContent = `${item.cantidad} × ${item.nombre} · ${euros.format(item.precio * item.cantidad)}`;

    const menos = document.createElement("button");
    menos.type = "button";
    menos.textContent = "−";
    menos.setAttribute("aria-label", `Quitar una unidad de ${item.nombre}`);
    menos.addEventListener("click", () => cambiarCantidad(id, -1));

    const mas = document.createElement("button");
    mas.type = "button";
    mas.textContent = "+";
    mas.setAttribute("aria-label", `Añadir una unidad de ${item.nombre}`);
    mas.addEventListener("click", () => cambiarCantidad(id, 1));

    li.append(texto, menos, mas);
    listaEl.append(li);
  });
  vacioEl.hidden = pedido.size > 0;
  totalEl.textContent = euros.format(totalPedido());
  enviarEl.disabled = pedido.size === 0;
}

productos.forEach((p) => {
  p.querySelector(".btn-pedir").addEventListener("click", () => {
    const id = p.dataset.id;
    const item = pedido.get(id);
    if (item) {
      item.cantidad += 1;
    } else {
      pedido.set(id, {
        nombre: p.dataset.nombre,
        precio: Number(p.dataset.precio),
        cantidad: 1,
      });
    }
    renderPedido();
  });
});

enviarEl.addEventListener("click", () => {
  if (pedido.size === 0) return;
  const lineas = [];
  pedido.forEach((i) =>
    lineas.push(`- ${i.cantidad} x ${i.nombre} (${euros.format(i.precio * i.cantidad)})`)
  );
  const mensaje = [
    "Hola, quiero hacer un pedido en 958 Burgers:",
    ...lineas,
    `Total: ${euros.format(totalPedido())}`,
  ].join("\n");
  const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener");
});

renderPedido();

// ---------- Abierto / Cerrado ahora ----------
// [apertura, cierre] en horas. 0 = domingo ... 6 = sábado. 24 = medianoche.
const HORARIO = {
  0: [13, 24],
  1: [13, 23],
  2: [13, 23],
  3: [13, 23],
  4: [13, 23],
  5: [13, 24],
  6: [13, 24],
};
const DIAS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatoHora(h) {
  return `${String(h % 24).padStart(2, "0")}:00`;
}

function actualizarEstado() {
  const estadoEl = document.getElementById("estado");
  if (!estadoEl) return;

  // Hora de Granada, aunque el visitante esté en otra zona horaria
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((p) => p.type === tipo).value;

  const dia = DIAS.indexOf(valor("weekday"));
  const hora = Number(valor("hour")) + Number(valor("minute")) / 60;
  const [abre, cierra] = HORARIO[dia];

  let texto;
  let abierto = false;
  if (hora >= abre && hora < cierra) {
    abierto = true;
    texto = `Abierto ahora · cierra a las ${formatoHora(cierra)}`;
  } else if (hora < abre) {
    texto = `Cerrado · abre hoy a las ${formatoHora(abre)}`;
  } else {
    texto = `Cerrado · abre mañana a las ${formatoHora(HORARIO[(dia + 1) % 7][0])}`;
  }

  estadoEl.textContent = texto;
  estadoEl.classList.toggle("abierto", abierto);
  estadoEl.classList.toggle("cerrado", !abierto);
}

actualizarEstado();
setInterval(actualizarEstado, 60000);