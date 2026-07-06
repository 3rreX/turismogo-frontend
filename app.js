let limiteServiciosPublicos = 24;

let servicioActualId = null;

async function cargarServicios() {
  try {
    const cont = document.getElementById('servicios');
    if (!cont) return;

    const res = await fetch(`${API_URL}/servicios`);
    const servicios = await res.json();
    const statServicios = document.getElementById('stat-servicios');

if (statServicios) {
  statServicios.textContent = servicios.length;
}

    if (!res.ok) {
      cont.innerHTML = `<p>${servicios.error || 'No se pudieron cargar los servicios.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    if (!Array.isArray(servicios) || servicios.length === 0) {
      cont.innerHTML = '<p>No hay servicios disponibles.</p>';
      return;
    }

    servicios.forEach((s) => {
  const imagenes = s.imagenes && s.imagenes.length ? s.imagenes : [s.imagen];

  cont.innerHTML += `
    <article class="service-card">
      <div class="service-gallery">
        ${imagenes.map(img => `
          <img src="${optimizarImagen(img)}" alt="${s.nombre}" loading="lazy">
        `).join('')}
      </div>

      <div class="service-content">
        <div class="service-header">
          <h3>${s.nombre}</h3>
          <span class="service-price">$${Number(s.precio).toLocaleString('es-CL')}</span>
        </div>

        <p class="service-description">${s.descripcion}</p>

        <div class="date-row">
          <div>
            <label>Inicio</label>
            <input type="date" id="inicio-${s._id}">
          </div>

          <div>
            <label>Fin</label>
            <input type="date" id="fin-${s._id}">
          </div>
        </div>

        <button class="reserve-btn" onclick="reservarServicio('${s.nombre}', '${s._id}')">
          Reservar ahora
        </button>
      </div>
    </article>
  `;
});
  } catch (error) {
    console.error('Error al cargar servicios:', error);
    const cont = document.getElementById('servicios');
    if (cont) {
      cont.innerHTML = '<p>Error al cargar servicios.</p>';
    }
  }
}


function toggleCentroNotificaciones() {
  const panel = document.getElementById('notification-panel');

  if (!panel) return;

  panel.classList.toggle('active');
}

function cerrarCentroNotificacionesAlClickFuera() {
  document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.notification-wrapper');

    if (!wrapper) return;

    if (!wrapper.contains(e.target)) {
      const panel = document.getElementById('notification-panel');
      if (panel) panel.classList.remove('active');
    }
  });
}

function renderNotificaciones(notificaciones) {
  const contador = document.getElementById('notification-count');
  const lista = document.getElementById('notification-list');

  if (!contador || !lista) return;

  const total = notificaciones.length;

  if (total > 0) {
    contador.textContent = total;
    contador.style.display = 'flex';
  } else {
    contador.textContent = '0';
    contador.style.display = 'none';
  }

  if (total === 0) {
    lista.innerHTML = '<p class="notification-empty">No tienes notificaciones pendientes.</p>';
    return;
  }

  lista.innerHTML = notificaciones.map(n => `
    <div class="notification-item" onclick="irANotificacion('${n.tab}', ${n.boton})">
      <div class="notification-icon">${n.icono}</div>
      <div class="notification-content">
        <strong>${n.titulo}</strong>
        <p>${n.descripcion}</p>
      </div>
    </div>
  `).join('');
}

function irANotificacion(tabId, numeroBoton) {
  const boton = document.querySelector(`.owner-tabs .dashboard-tab-btn:nth-child(${numeroBoton})`);

  if (boton) {
    mostrarTabDashboard(tabId, boton);
  }

  const panel = document.getElementById('notification-panel');
  if (panel) {
    panel.classList.remove('active');
  }
}

async function cargarNotificacionesPropietario() {
  try {
    const role = localStorage.getItem('role');
    if (role !== 'propietario') return;

    const token = localStorage.getItem('token');
    const notificaciones = [];

    const resReservas = await fetch(`${API_URL}/reservas-propietario`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

  const dataReservas = await resReservas.json();

const reservas = Array.isArray(dataReservas.reservas)
  ? dataReservas.reservas
  : Array.isArray(dataReservas)
    ? dataReservas
    : [];

if (Array.isArray(reservas)) {
  const pendientes = reservas.filter(
    r => ['pendiente', 'pendiente_pago', 'reembolso_pendiente'].includes((r.estado || '').toLowerCase())
  );

  const confirmadas = reservas.filter(
    r => (r.estado || '').toLowerCase() === 'confirmada'
  );

      if (pendientes.length > 0) {
  notificaciones.push({
  icono: '📅',
  titulo: `${pendientes.length} reserva${pendientes.length > 1 ? 's' : ''} pendiente${pendientes.length > 1 ? 's' : ''}`,
  descripcion: 'Tienes reservas pendientes de pago, revisión o gestión operativa.',
  tab: 'owner-reservas',
  boton: 4
});
}

      if (confirmadas.length > 0) {
  notificaciones.push({
  icono: '✅',
  titulo: `${confirmadas.length} reserva${confirmadas.length > 1 ? 's' : ''} confirmada${confirmadas.length > 1 ? 's' : ''}`,
  descripcion: 'Revísalas en el calendario de ocupación.',
  tab: 'owner-calendario',
  boton: 5
});
}
    }

    const resMensajes = await fetch(`${API_URL}/mensajes-propietario`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const mensajes = await resMensajes.json();

    if (Array.isArray(mensajes) && mensajes.length > 0) {
  notificaciones.push({
  icono: '💬',
  titulo: `${mensajes.length} mensaje${mensajes.length > 1 ? 's' : ''} recibido${mensajes.length > 1 ? 's' : ''}`,
  descripcion: 'Tienes consultas de clientes interesados en tus servicios.',
  tab: 'owner-mensajes',
  boton: 6
});
}

    renderNotificaciones(notificaciones);

  } catch (error) {
    console.error('Error cargando notificaciones:', error);
  }
}
function mostrarPanelCliente() {
  const role = localStorage.getItem('role');
  const panel = document.getElementById('panel-cliente');

  if (!panel) return;

  if (role === 'usuario') {
    panel.style.display = 'block';

    if (typeof cargarReservasCliente === 'function') {
      cargarReservasCliente();
    }
  } else {
    panel.style.display = 'none';
  }
}

window.onload = () => {
  if (typeof despertarBackend === 'function') {
    despertarBackend();
  }

  if (document.getElementById('servicios')) {
    cargarServicios();
  }

  if (document.getElementById('servicios-publicos')) {
    cargarServiciosPublicos();
  }

  if (document.getElementById('reservas')) {
    cargarReservas();
  }

  if (document.getElementById('perfil')) {
    cargarPerfil();
  }

  if (document.getElementById('detalle-galeria')) {
    cargarDetalleServicio();
  }

  mostrarPanelPropietario();
  mostrarPanelAdmin();
  mostrarPanelCliente();
  cerrarCentroNotificacionesAlClickFuera();
  cargarNotificacionesPropietario();
};

document.getElementById('nuevo-imagen')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  const preview = document.getElementById('preview-imagen');

  if (!file || !preview) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    preview.src = event.target.result;
    preview.style.display = 'block';
  };

  reader.readAsDataURL(file);
});

let servicioEditandoId = null;


async function simularPagoPlan(plan) {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/webpay/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan })
    });

    const data = await res.json();

    if (!res.ok) {
    mostrarAlerta(data.error || 'No se pudo iniciar el pago');
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = data.url;

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = data.token;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();

  } catch (error) {
    console.error('Error Webpay:', error);
   mostrarAlerta('Error iniciando pago');
  }
}
async function cargarDetalleServicio() {
  try {
    const contGaleria = document.getElementById('detalle-galeria');
    if (!contGaleria) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    servicioActualId = id;

    if (!id) {
      document.getElementById('detalle-nombre').textContent = 'Servicio no encontrado';
      return;
    }

    const res = await fetch(`${API_URL}/servicios/${id}/publico`);
    const servicio = await res.json();

    if (!res.ok) {
      document.getElementById('detalle-nombre').textContent =
        servicio.error || 'Servicio no disponible';
      return;
    }

    const imagenes = servicio.imagenes && servicio.imagenes.length
      ? servicio.imagenes.filter(Boolean)
      : servicio.imagen
        ? [servicio.imagen]
        : ['https://placehold.co/900x600?text=TurismoGO'];

    document.getElementById('detalle-nombre').textContent = servicio.nombre;

    const descripcion = document.getElementById('detalle-descripcion');
    if (descripcion) {
      descripcion.textContent = servicio.descripcion || 'Servicio turístico disponible en TurismoGO.';
    }

    document.getElementById('detalle-precio').textContent =
      `$${Number(servicio.precio).toLocaleString('es-CL')}`;

    const propietario = servicio.propietarioId?.username || 'Anfitrión TurismoGO';

    document.getElementById('detalle-propietario').textContent =
      `Anfitrión: ${propietario}`;

    const ownerAvatar = document.getElementById('owner-avatar');
    if (ownerAvatar) {
      ownerAvatar.textContent = propietario.charAt(0).toUpperCase();
    }

    const imagenPrincipal = imagenes[0];

    const miniaturas = imagenes.slice(1, 4);

    while (miniaturas.length < 3) {
      miniaturas.push(imagenPrincipal);
    }

    contGaleria.innerHTML = `
      <img class="main-img" src="${imagenPrincipal}" alt="${servicio.nombre}">

      <div class="gallery-small">
        ${miniaturas.map(img => `
          <img class="small-img" src="${img}" alt="${servicio.nombre}">
        `).join('')}
      </div>
    `;

  } catch (error) {
    console.error('Error detalle servicio:', error);
  }
}

async function cargarServiciosPublicos() {
  try {
    const cont = document.getElementById('servicios-publicos');
    const buscador = document.getElementById('buscador-servicios');

    if (!cont) return;

    // 👇 SKELETON INICIAL
    cont.innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;

    // 👇 FUNCIÓN RENDER (DECLARADA ARRIBA → CORRECTO)
    function renderizarServicios(lista) {
      
      cont.innerHTML = '';

      if (lista.length === 0) {
        cont.innerHTML = `
          <p class="empty-services">
            No encontramos servicios que coincidan con tu búsqueda.
          </p>
        `;
        return;
      }

      lista.forEach((s) => {
        const imagenPrincipal =
          s.imagenes && s.imagenes.length && s.imagenes[0]
            ? s.imagenes[0]
            : s.imagen || 'https://placehold.co/400x300?text=TurismoGO';

        const planPropietario = s.propietarioId?.plan || 'ninguno';
        const esPremium = planPropietario === 'premium';
        const esPro = planPropietario === 'pro';

        cont.innerHTML += `
  <article class="public-service-card ${esPremium ? 'premium-service-card' : ''}">
    
    <div class="public-image-wrap">
      <img src="${optimizarImagen(imagenPrincipal)}" alt="${s.nombre}" loading="lazy">

      <div class="public-card-badges">
        <span class="verified-badge">Verificado</span>
        ${
          esPremium
            ? '<span class="premium-badge">Premium</span><span class="featured-badge">Destacado</span>'
            : esPro
              ? '<span class="pro-badge">Pro</span>'
              : ''
        }
      </div>
    </div>

    <div class="public-service-content">

      <div class="card-top-row">
        <h3>${s.nombre}</h3>
        <span class="card-price">$${Number(s.precio).toLocaleString('es-CL')}</span>
      </div>

      <p class="card-description">
        ${s.descripcion.length > 90 ? s.descripcion.slice(0, 90) + '...' : s.descripcion}
      </p>

      <div class="card-trust">
  <span>🛡️ Propietario verificado</span>
  <span>💳 Pago seguro</span>
</div>


      <div class="card-urgency">
  ${Math.random() > 0.5 ? '<span class="urgency-high">🔥 Alta demanda</span>' : ''}
  ${Math.random() > 0.6 ? '<span class="urgency-low">⏳ Últimos cupos</span>' : ''}
</div>
        

      <button class="btn-ver-servicio" data-id="${s._id}">
        Ver disponibilidad
      </button>

    </div>
  </article>
`;
      });
      // 👇 EVENTOS DESPUÉS DE RENDER
document.querySelectorAll('.btn-ver-servicio').forEach((btn) => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    window.location.href = `servicio.html?id=${id}`;
  });
});
    }

    // 👇 CACHE LOCAL (CARGA INMEDIATA)
    let servicios = [];

   const cacheServicios = localStorage.getItem('turismogo_servicios_cache');
const cacheFecha = localStorage.getItem('turismogo_servicios_cache_fecha');
const cacheValida =
  cacheFecha && Date.now() - Number(cacheFecha) < 10 * 60 * 1000;

if (cacheServicios && cacheValida) {
  try {
    servicios = JSON.parse(cacheServicios);

    if (Array.isArray(servicios) && servicios.length > 0) {
      renderizarServicios(servicios);
    }
  } catch (error) {
    console.warn('Cache inválida:', error);
    localStorage.removeItem('turismogo_servicios_cache');
    localStorage.removeItem('turismogo_servicios_cache_fecha');
  }
} else {
  localStorage.removeItem('turismogo_servicios_cache');
  localStorage.removeItem('turismogo_servicios_cache_fecha');
}

    // 👇 FETCH REAL
    const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 8000);

const res = await fetch(`${API_URL}/servicios?limit=${limiteServiciosPublicos}`, {
  signal: controller.signal,
  cache: 'no-store'
});

clearTimeout(timeoutId);
    const serviciosActualizados = await res.json();

    if (!res.ok || !Array.isArray(serviciosActualizados)) {
      if (!servicios.length) {
        cont.innerHTML = `<p>Error al cargar servicios.</p>`;
      }
      return;
    }

    servicios = serviciosActualizados;
    const btnVerMas = document.getElementById('btn-ver-mas-servicios');

if (btnVerMas) {
  if (serviciosActualizados.length < limiteServiciosPublicos) {
    btnVerMas.style.display = 'none';
  } else {
    btnVerMas.style.display = 'block';
  }
}

    // 👇 GUARDAR CACHE
    localStorage.setItem(
      'turismogo_servicios_cache',
      JSON.stringify(serviciosActualizados)
    );

    localStorage.setItem(
  'turismogo_servicios_cache_fecha',
  String(Date.now())
);

    // 👇 ORDENAMIENTO
    const prioridadPlan = {
      premium: 1,
      pro: 2,
      basico: 3,
      ninguno: 4
    };

    servicios.sort((a, b) => {
      const planA = a.propietarioId?.plan || 'ninguno';
      const planB = b.propietarioId?.plan || 'ninguno';
      return prioridadPlan[planA] - prioridadPlan[planB];
    });

    // 👇 RENDER FINAL
    renderizarServicios(servicios);

    // 👇 FILTROS (NO TOCAR)
    const botonesFiltro = document.querySelectorAll('.filter-btn');
    let filtroCategoria = 'todos';

    function aplicarFiltros() {
      const texto = buscador ? buscador.value.trim().toLowerCase() : '';

      const serviciosFiltrados = servicios.filter((s) => {
        const nombre = (s.nombre || '').toLowerCase();
        const descripcion = (s.descripcion || '').toLowerCase();

        const coincideTexto =
          nombre.includes(texto) ||
          descripcion.includes(texto);

        const coincideCategoria =
          filtroCategoria === 'todos' ||
          nombre.includes(filtroCategoria) ||
          descripcion.includes(filtroCategoria);

        return coincideTexto && coincideCategoria;
      });

      renderizarServicios(serviciosFiltrados);
    }

    if (buscador) {
      buscador.addEventListener('input', aplicarFiltros);
    }

    botonesFiltro.forEach((btn) => {
      btn.addEventListener('click', () => {
        botonesFiltro.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        filtroCategoria = btn.dataset.filter;
        aplicarFiltros();
      });
    });

  } catch (error) {
    console.error('Error al cargar servicios públicos:', error);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const btnVerMas = document.getElementById('btn-ver-mas-servicios');

  if (btnVerMas) {
    btnVerMas.addEventListener('click', () => {
      limiteServiciosPublicos += 24;
      cargarServiciosPublicos();
    });
  }
});



async function enviarMensajeServicio() {
  try {
    if (!servicioActualId) {
      mostrarAlerta('No se encontró el servicio.');
      return;
    }

    const nombreCliente = document.getElementById('chat-nombre')?.value.trim();
    const emailCliente = document.getElementById('chat-email')?.value.trim();
    const mensaje = document.getElementById('chat-mensaje')?.value.trim();

    if (!nombreCliente || !emailCliente || !mensaje) {
     mostrarAlerta('Debes completar nombre, correo y mensaje.');
      return;
    }

    const res = await fetch(`${API_URL}/servicios/${servicioActualId}/mensajes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombreCliente,
        emailCliente,
        mensaje
      })
    });

    const data = await res.json();

    if (!res.ok) {
     mostrarAlerta(data.error || 'No se pudo enviar el mensaje.');
      return;
    }

   mostrarAlerta(data.message || 'Mensaje enviado correctamente.');

    document.getElementById('chat-nombre').value = '';
    document.getElementById('chat-email').value = '';
    document.getElementById('chat-mensaje').value = '';

  } catch (error) {
    console.error('Error enviando mensaje:', error);
   mostrarAlerta('Error al enviar mensaje.');
  }
}

function mostrarRegistroPropietario() {
  const modal = document.getElementById('registro-propietario');

  if (!modal) {
    console.error('Modal registro-propietario no encontrado');
    return;
  }

  // Si está oculto → mostrar
  if (modal.style.display === 'none' || modal.style.display === '') {
    modal.style.display = 'flex';
  } else {
    modal.style.display = 'none';
  }
}
async function registrarPropietarioConPago() {
  try {
    const nombreCompleto = document.getElementById('reg-nombre').value.trim();
    const telefono = document.getElementById('reg-telefono').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const username = document.getElementById('reg-usuario').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const plan = document.getElementById('reg-plan').value;
    const aceptaLegalPropietario = document.getElementById('aceptaLegalPropietario')?.checked;

    if (!nombreCompleto || !telefono || !email || !username || !password || !plan) {
      mostrarAlerta('Debe completar todos los campos para registrar la cuenta de propietario.');
      return;
    }

    if (!aceptaLegalPropietario) {
      mostrarAlerta('Debes aceptar los Términos y Condiciones y la Política de Privacidad para continuar.');
      return;
    }

    const resRegistro = await fetch(`${API_URL}/register-propietario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombreCompleto,
        telefono,
        email,
        username,
        password
      })
    });

    const dataRegistro = await resRegistro.json();

    if (!resRegistro.ok) {
      mostrarAlerta(dataRegistro.error || 'No fue posible registrar la cuenta.');
      return;
    }

    const resLogin = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const dataLogin = await resLogin.json();

    if (!resLogin.ok || !dataLogin.token) {
      mostrarAlerta('Cuenta creada, pero no fue posible iniciar sesión automáticamente.');
      return;
    }

    localStorage.setItem('token', dataLogin.token);

    const payload = JSON.parse(atob(dataLogin.token.split('.')[1]));
    localStorage.setItem('role', payload.role);

mostrarAlerta('Cuenta creada correctamente. Ya puedes acceder al panel y publicar tus servicios.');

setTimeout(() => {
  window.location.href = 'dashboard.html';
}, 1200);

  } catch (error) {
    console.error('Error en registro de propietario:', error);
    mostrarAlerta('Ocurrió un error al registrar la cuenta de propietario.');
  }
}

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-ver-servicio')) {
    const id = e.target.dataset.id;
    abrirModalServicio(id);
  }
});




