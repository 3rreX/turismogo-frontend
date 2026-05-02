function optimizarImagen(url) {
  if (!url || !url.includes('cloudinary')) return url;

  return url.replace(
    '/upload/',
    '/upload/f_auto,q_auto,w_800/'
  );
}
function mostrarAlerta(mensaje) {
  if (typeof customAlert === 'function') {
    customAlert(mensaje); // usa modal premium si existe
  } else {
    alert(mensaje); // fallback en otras páginas
  }

  function despertarBackend() {
  if (typeof API_URL === 'undefined') return;

  fetch(`${API_URL}/health`, {
    method: 'GET',
    cache: 'no-store'
  }).catch(() => {
    console.warn('Backend aún no responde al warm-up');
  });
}
}
function mostrarAlerta(mensaje) {
  if (typeof customAlert === 'function') {
    customAlert(mensaje);
  } else {
    alert(mensaje);
  }
}

async function login() {
  try {
    const userInput = document.getElementById('user');
    const passInput = document.getElementById('pass');
    const errorBox = document.getElementById('error');
    

    if (!userInput || !passInput) return;

    const username = userInput.value.trim();
    const password = passInput.value.trim();

    if (!username || !password) {
      if (errorBox) {
        errorBox.innerText = 'Debes ingresar usuario y contraseña';
      }
      return;
    }

    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      if (errorBox) {
        errorBox.innerText = data.error || 'Error al iniciar sesión';
      }
      return;
    }

    if (data.token) {
  localStorage.setItem('token', data.token);

  const payload = JSON.parse(atob(data.token.split('.')[1]));
  localStorage.setItem('role', payload.role);

  window.location.href = 'dashboard.html';
} else if (errorBox) {
  errorBox.innerText = 'No se recibió token';
}
  } catch (error) {
    console.error('Error en login:', error);
    const errorBox = document.getElementById('error');
    if (errorBox) {
      errorBox.innerText = 'No se pudo conectar con el servidor';
    }
  }
}
let servicioActualId = null;
async function cargarPerfil() {
  try {
    const token = localStorage.getItem('token');
    const perfil = document.getElementById('perfil');

    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    const res = await fetch(`${API_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      window.location.href = 'login.html';
      return;
    }

    if (data.username && perfil) {
  const role = localStorage.getItem('role');

  if (role === 'admin') {
    perfil.innerHTML = `
      <p><strong>Usuario:</strong> ${data.username}</p>
      <p><strong>Rol:</strong> Administrador</p>
    `;
  } else {
    perfil.innerHTML = `
      <p><strong>Usuario:</strong> ${data.username}</p>

      <p>
        <strong>Plan:</strong>
        ${data.plan ? data.plan : 'Sin plan activo'}
      </p>

      <p>
        <strong>Estado de suscripción:</strong>
        ${
          data.suscripcionActiva
            ? '<span style="color: green; font-weight: bold;">Activa</span>'
            : '<span style="color: #ff6236; font-weight: bold;">Pendiente de pago</span>'
        }
      </p>
    `;
  }
}
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    window.location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.location.href = 'index.html';
}

async function crearReserva() {
  try {
    const servicioInput = document.getElementById('servicio');
    const inicioInput = document.getElementById('inicio');
    const finInput = document.getElementById('fin');

    if (!servicioInput || !inicioInput || !finInput) return;

    const servicio = servicioInput.value;
    const fechaInicio = inicioInput.value;
    const fechaFin = finInput.value;
    const token = localStorage.getItem('token');

    if (!token) {
      mostrarAlerta('Debes iniciar sesión');
      window.location.href = 'login.html';
      return;
    }

    if (!fechaInicio || !fechaFin) {
      mostrarAlerta('Debes seleccionar fechas');
      return;
    }

    if (fechaFin < fechaInicio) {
      mostrarAlerta('La fecha final no puede ser menor a la fecha inicial');
      return;
    }

    const res = await fetch(`${API_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ servicio, fechaInicio, fechaFin })
    });

    const data = await res.json();
    mostrarAlerta(data.message || data.error || 'Respuesta desconocida');

    if (res.ok) {
      cargarReservas();
    }
  } catch (error) {
    console.error('Error al crear reserva:', error);
  }
}

async function cargarReservas() {
  try {
    const cont = document.getElementById('reservas');
    if (!cont) return;

    const token = localStorage.getItem('token');

    if (!token) {
      cont.innerHTML = '<p>Debes iniciar sesión para ver tus reservas.</p>';
      return;
    }

    const res = await fetch(`${API_URL}/reservas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const reservas = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${reservas.error || 'No se pudieron cargar las reservas.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    if (!Array.isArray(reservas) || reservas.length === 0) {
      cont.innerHTML = '<p>No tienes reservas todavía.</p>';
      return;
    }

    reservas.forEach((r) => {
  const estado = r.estado || 'pendiente';

  cont.innerHTML += `
    <article class="reservation-card">
      <div class="reservation-top">
        <div>
          <h3>${r.servicio}</h3>
          <p>Reserva turística</p>
        </div>

        <span class="status-badge status-${estado}">
          ${estado}
        </span>
      </div>

      <div class="reservation-dates">
        <div>
          <span>Inicio</span>
          <strong>${r.fechaInicio}</strong>
        </div>

        <div>
          <span>Fin</span>
          <strong>${r.fechaFin}</strong>
        </div>
      </div>

      ${
        estado !== 'cancelada'
          ? `<button class="cancel-btn" onclick="cancelarReserva('${r._id}')">Cancelar reserva</button>`
          : '<p class="cancelled-text">Reserva cancelada</p>'
      }
    </article>
  `;
});

  } catch (error) {
    console.error('Error al cargar reservas:', error);
    const cont = document.getElementById('reservas');
    if (cont) {
      cont.innerHTML = '<p>Error al cargar reservas.</p>';
    }
  }
}
async function cancelarReserva(reservaId) {
  try {
    const confirmar = await customConfirm('¿Seguro que deseas cancelar esta reserva?');

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/reservas/${reservaId}/cancelar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No se pudo cancelar la reserva');
      return;
    }

    mostrarAlerta(data.message || 'Reserva cancelada correctamente');

    cargarReservas();
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    mostrarAlerta('Error al cancelar reserva');
  }
}
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

async function reservarServicio(nombre, id) {
  try {
    const inicioInput = document.getElementById(`inicio-${id}`);
    const finInput = document.getElementById(`fin-${id}`);

    if (!inicioInput || !finInput) return;

    const fechaInicio = inicioInput.value;
    const fechaFin = finInput.value;
    const token = localStorage.getItem('token');

    if (!token) {
      mostrarAlerta('Debes iniciar sesión');
      window.location.href = 'login.html';
      return;
    }

    if (!fechaInicio || !fechaFin) {
      mostrarAlerta('Debes seleccionar fechas');
      return;
    }

    if (fechaFin < fechaInicio) {
      mostrarAlerta('La fecha final no puede ser menor a la fecha inicial');
      return;
    }

    const res = await fetch(`${API_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        servicio: nombre,
        fechaInicio,
        fechaFin
      })
    });

    const data = await res.json();
   mostrarAlerta(data.message || data.error || 'Respuesta desconocida');

    if (res.ok) {
      cargarReservas();
    }
  } catch (error) {
    console.error('Error al reservar servicio:', error);
  }
}
function mostrarPanelPropietario() {
  const role = localStorage.getItem('role');
  const panel = document.getElementById('panel-propietario');

  if (!panel) return;

  if (role === 'propietario') {
    panel.style.display = 'block';
    cargarMisServicios();
    cargarReservasPropietario();
    cargarCalendarioPropietario();
    cargarMensajesPropietario();
  } else {
    panel.style.display = 'none';
  }
}
async function crearServicio() {
  try {
    const nombre = document.getElementById('nuevo-nombre')?.value.trim();
    const descripcion = document.getElementById('nuevo-descripcion')?.value.trim();
    const precio = document.getElementById('nuevo-precio')?.value.trim();
    const imagenFiles = document.getElementById('nuevo-imagen')?.files;

    const token = localStorage.getItem('token');

    if (!token) {
      mostrarAlerta('Debes iniciar sesión');
      window.location.href = 'index.html';
      return;
    }

    if (!nombre || !descripcion || !precio || !imagenFiles || imagenFiles.length === 0) {
      mostrarAlerta('Todos los campos son obligatorios');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);
    for (const file of imagenFiles) {
  formData.append('imagenes', file);
}

    const res = await fetch(`${API_URL}/servicios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No se pudo crear el servicio');
      return;
    }

    mostrarAlerta(data.message || 'Servicio creado correctamente');

    document.getElementById('nuevo-nombre').value = '';
    document.getElementById('nuevo-descripcion').value = '';
    document.getElementById('nuevo-precio').value = '';
    document.getElementById('nuevo-imagen').value = '';

    cargarServicios();
  } catch (error) {
    console.error('Error al crear servicio:', error);
   mostrarAlerta('Error al crear servicio');
  }
}

window.onload = () => {
  despertarBackend();

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
async function cargarMisServicios() {
  try {
    const cont = document.getElementById('mis-servicios');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/mis-servicios`, {
     headers: {
  'Authorization': `Bearer ${token}`
}
    });

    const servicios = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${servicios.error || 'No se pudieron cargar tus servicios.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    if (!servicios.length) {
      cont.innerHTML = '<p>Aún no tienes servicios publicados.</p>';
      return;
    }

    servicios.forEach((s) => {
  const imagenes = s.imagenes && s.imagenes.length ? s.imagenes : [s.imagen];

  cont.innerHTML += `
    <article class="owner-service-card">
      <div class="owner-service-gallery">
        ${imagenes.map(img => `
          <div class="owner-image-box">
            <img src="${optimizarImagen(img)}" alt="${s.nombre}" loading="lazy">
            <button onclick='eliminarImagenServicio(${JSON.stringify(s._id)}, ${JSON.stringify(img)})'>
              Eliminar imagen
            </button>
          </div>
        `).join('')}
      </div>

      <div class="owner-service-content">
        <div>
          <h3>${s.nombre}</h3>
          <p>${s.descripcion}</p>
          <strong>$${Number(s.precio).toLocaleString('es-CL')}</strong>
        </div>

        <div class="owner-actions">
          <button onclick='abrirModalEditarServicio(${JSON.stringify(s)})'>
          Editar
          </button>

          <button class="danger-btn" onclick="eliminarServicio('${s._id}')">
            Eliminar servicio
          </button>
        </div>
      </div>
    </article>
  `;
});
} catch (error) {
  console.error('Error al cargar mis servicios:', error);
}
}
let servicioEditandoId = null;

function abrirModalEditarServicio(servicio) {
  servicioEditandoId = servicio._id;

  document.getElementById('editarNombre').value = servicio.nombre || '';
  document.getElementById('editarDescripcion').value = servicio.descripcion || '';
  document.getElementById('editarPrecio').value = servicio.precio || '';
  document.getElementById('editarImagenes').value = '';

  const imagenesActuales = document.getElementById('imagenesActuales');
  const imagenes = servicio.imagenes && servicio.imagenes.length
    ? servicio.imagenes
    : servicio.imagen
      ? [servicio.imagen]
      : [];

  imagenesActuales.innerHTML = `
    <h3>Imágenes actuales</h3>
    <div class="owner-service-gallery">
      ${
        imagenes.length
          ? imagenes.map(img => `
              <div class="owner-image-box">
                <img src="${optimizarImagen(img)}" alt="${servicio.nombre}" loading="lazy">
                <button type="button" onclick='eliminarImagenDesdeModal(${JSON.stringify(servicio._id)}, ${JSON.stringify(img)})'>
                  Eliminar imagen
                </button>
              </div>
            `).join('')
          : '<p>Este servicio no tiene imágenes cargadas.</p>'
      }
    </div>
  `;

  document.getElementById('modalEditarServicio').style.display = 'flex';
}

function cerrarModalEditarServicio() {
  servicioEditandoId = null;
  document.getElementById('modalEditarServicio').style.display = 'none';
}

async function guardarCambiosServicio() {
  const nombre = document.getElementById('editarNombre').value.trim();
  const descripcion = document.getElementById('editarDescripcion').value.trim();
  const precio = document.getElementById('editarPrecio').value.trim();
  const imagenFiles = document.getElementById('editarImagenes').files;

  if (!servicioEditandoId) {
   mostrarAlerta('No se encontró el servicio a editar.');
    return;
  }

  if (!nombre || !descripcion || !precio) {
    mostrarAlerta('Nombre, descripción y precio son obligatorios.');
    return;
  }

  await editarServicio(
    servicioEditandoId,
    nombre,
    descripcion,
    precio,
    imagenFiles
  );

  cerrarModalEditarServicio();
}

async function eliminarImagenDesdeModal(servicioId, imagenUrl) {
  await eliminarImagenServicio(servicioId, imagenUrl);

  const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}/mis-servicios`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const servicios = await res.json();
  const servicioActualizado = servicios.find(s => s._id === servicioId);

  if (servicioActualizado) {
    abrirModalEditarServicio(servicioActualizado);
  }
}
async function eliminarServicio(id) {
  try {
    const confirmar = await customConfirm('¿Seguro que deseas eliminar este servicio?');

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/servicios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
     mostrarAlerta(data.error || 'No se pudo eliminar el servicio');
      return;
    }

    mostrarAlerta(data.message || 'Servicio eliminado correctamente');

    cargarServicios();
    cargarMisServicios();
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    mostrarAlerta('Error al eliminar servicio');
  }
}
async function mostrarFormularioEditar(id, nombre, descripcion, precio) {
  const nuevoNombre = prompt('Nuevo nombre:', nombre);
  if (nuevoNombre === null) return;

  const nuevaDescripcion = prompt('Nueva descripción:', descripcion);
  if (nuevaDescripcion === null) return;

  const nuevoPrecio = prompt('Nuevo precio:', precio);
  if (nuevoPrecio === null) return;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;

  input.onchange = () => {
    editarServicio(id, nuevoNombre, nuevaDescripcion, nuevoPrecio, input.files);
  };

  const agregarImagenes = await customConfirm('¿Deseas agregar nuevas imágenes a este servicio?');

  if (agregarImagenes) {
    input.click();
  } else {
    editarServicio(id, nuevoNombre, nuevaDescripcion, nuevoPrecio, null);
  }
}
async function editarServicio(id, nombre, descripcion, precio, imagenFiles = null) {
  try {
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('precio', precio);
    if (imagenFiles && imagenFiles.length > 0) {
  for (const file of imagenFiles) {
    formData.append('imagenes', file);
  }
}

    const res = await fetch(`${API_URL}/servicios/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
     mostrarAlerta(data.error || 'No se pudo editar el servicio');
      return;
    }

    mostrarAlerta(data.message || 'Servicio actualizado');

    cargarServicios();
    cargarMisServicios();
  } catch (error) {
    console.error('Error al editar servicio:', error);
   mostrarAlerta('Error al editar servicio');
  }
}
async function eliminarImagenServicio(servicioId, imagenUrl) {
  try {
    const confirmar = await customConfirm('¿Eliminar esta imagen?');
    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/servicios/${servicioId}/imagenes`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ imagenUrl })
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No se pudo eliminar la imagen');
      return;
    }

    mostrarAlerta(data.message || 'Imagen eliminada correctamente');

    cargarServicios();
    cargarMisServicios();
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
   mostrarAlerta('Error al eliminar imagen');
  }
}
async function cargarReservasPropietario() {
  try {
    const cont = document.getElementById('reservas-propietario');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/reservas-propietario`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const reservas = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${reservas.error || 'No se pudieron cargar las reservas.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    if (!Array.isArray(reservas) || reservas.length === 0) {
      cont.innerHTML = `
        <div class="empty-owner-state">
          <h3>Aún no tienes reservas recibidas</h3>
          <p>Cuando un cliente solicite o pague una reserva, aparecerá en esta sección.</p>
        </div>
      `;
      return;
    }

    const pendientes = reservas.filter(r => r.estado === 'pendiente').length;
    const confirmadas = reservas.filter(r => r.estado === 'confirmada').length;

    let ingresos = 0;

    reservas.forEach((r) => {
      if (r.estado === 'confirmada') {
        ingresos +=
          Number(r.montoPagado) ||
          Number(r.montoTotal) ||
          Number(r.precio) ||
          Number(r.servicioId?.precio) ||
          0;
      }
    });

    const statPendientes = document.getElementById('stat-pendientes');
    const statConfirmadas = document.getElementById('stat-confirmadas');
    const statIngresos = document.getElementById('stat-ingresos');

    if (statPendientes) statPendientes.textContent = pendientes;
    if (statConfirmadas) statConfirmadas.textContent = confirmadas;
    if (statIngresos) statIngresos.textContent = `$${ingresos.toLocaleString('es-CL')}`;

    reservas.forEach((r) => {
      const estado = r.estado || 'pendiente';
      const pagoEstado = r.pagoEstado || 'pendiente';

      const nombreCliente =
        r.usuarioId?.username ||
        r.nombreCliente ||
        'Cliente externo';

      const emailCliente =
        r.emailCliente || 'No informado';

      const telefonoCliente =
        r.telefonoCliente || 'No informado';

      const personasReserva =
        r.personas || 'No informado';

      const mensajeCliente =
        r.mensajeCliente || 'Sin mensaje adicional';

      const monto =
        Number(r.montoPagado) ||
        Number(r.montoTotal) ||
        Number(r.precio) ||
        Number(r.servicioId?.precio) ||
        0;

      cont.innerHTML += `
  <article class="owner-reservation-card compact-reservation-card">
    <div class="owner-reservation-header">
      <div>
        <span class="reservation-label">Reserva recibida</span>
        <h3>${r.servicio}</h3>
        <p>Solicitud generada desde TurismoGO</p>
      </div>

      <div class="reservation-badges">
        <span class="status-badge status-${estado}">
          ${estado}
        </span>

        <span class="payment-badge payment-${pagoEstado}">
          Pago: ${pagoEstado}
        </span>
      </div>
    </div>

    <div class="reservation-main-actions">
  <button
    class="approve-btn"
    onclick="cambiarEstadoReserva('${r._id}', 'confirmada')"
  >
    Confirmar
  </button>

  <button
    class="reject-btn"
    onclick="cambiarEstadoReserva('${r._id}', 'rechazada')"
  >
    Rechazar
  </button>

  <button
    class="details-btn"
    onclick="toggleDetalleReserva('${r._id}')"
  >
    Ver detalles
  </button>
</div>

    <div id="detalle-reserva-${r._id}" class="reservation-details-hidden">
      <div class="owner-client-box">
        <div>
          <span>Cliente</span>
          <strong>${nombreCliente}</strong>
        </div>

        <div>
          <span>Correo</span>
          <strong>${emailCliente}</strong>
        </div>

        <div>
          <span>Teléfono</span>
          <strong>${telefonoCliente}</strong>
        </div>

        <div>
          <span>Personas</span>
          <strong>${personasReserva}</strong>
        </div>
      </div>

      <div class="owner-reservation-dates">
        <div>
          <span>Fecha inicio</span>
          <strong>${r.fechaInicio}</strong>
        </div>

        <div>
          <span>Fecha fin</span>
          <strong>${r.fechaFin}</strong>
        </div>

        <div>
          <span>Monto estimado</span>
          <strong>$${monto.toLocaleString('es-CL')}</strong>
        </div>
      </div>

      <div class="owner-message-box">
        <span>Mensaje del cliente</span>
        <p>${mensajeCliente}</p>
      </div>
    </div>
  </article>
`;
    });

  } catch (error) {
    console.error('Error al cargar reservas del propietario:', error);
  }
}
async function cambiarEstadoReserva(reservaId, estado) {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/reservas/${reservaId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ estado })
    });

    const data = await res.json();

    if (!res.ok) {
     mostrarAlerta(data.error || 'No se pudo actualizar la reserva');
      return;
    }

    mostrarAlerta(data.message || 'Reserva actualizada');

    cargarReservasPropietario();
  } catch (error) {
    console.error('Error al cambiar estado de reserva:', error);
   mostrarAlerta('Error al actualizar reserva');
  }
}
function mostrarPanelAdmin() {
  const role = localStorage.getItem('role');
  const panel = document.getElementById('panel-admin');

  if (!panel) return;

  if (role === 'admin') {
    panel.style.display = 'block';
    cargarUsuariosAdmin();
    cargarServiciosAdmin();
    cargarReservasAdmin();
  } else {
    panel.style.display = 'none';
  }
}
async function cargarUsuariosAdmin() {
  try {
    const cont = document.getElementById('admin-usuarios');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/admin/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const usuarios = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${usuarios.error || 'No se pudieron cargar usuarios.'}</p>`;
      return;
    }
document.getElementById('admin-stat-usuarios').textContent = usuarios.length;

const propietarios = usuarios.filter(u => u.role === 'propietario').length;
document.getElementById('admin-stat-propietarios').textContent = propietarios;
    cont.innerHTML = '';

    usuarios.forEach((u) => {
  cont.innerHTML += `
    <article class="admin-user-card">
      <div class="admin-card-top">
        <div>
          <h3>${u.username}</h3>
          <p>Cuenta registrada</p>
        </div>

        <span class="role-badge role-${u.role}">
          ${u.role}
        </span>
      </div>

      <div class="admin-user-info">
        <p><b>Suscripción:</b> ${u.suscripcionActiva ? 'Activa' : 'Inactiva'}</p>
        <p><b>Plan:</b> ${u.plan || 'ninguno'}</p>
      </div>

      <div class="admin-actions">
        <button onclick="cambiarRolUsuario('${u._id}', 'usuario')">Usuario</button>
        <button onclick="cambiarRolUsuario('${u._id}', 'propietario')">Propietario</button>
        <button onclick="cambiarRolUsuario('${u._id}', 'admin')">Admin</button>
      </div>
      <div class="admin-actions">
  <button
    class="danger-btn"
    onclick="eliminarUsuarioAdmin('${u._id}', '${u.username}')"
  >
    Eliminar usuario
  </button>
</div>

      <div class="admin-actions">
        <button onclick="actualizarSuscripcionUsuario('${u._id}', true, 'basico')">Básico</button>
        <button onclick="actualizarSuscripcionUsuario('${u._id}', true, 'pro')">Pro</button>
        <button onclick="actualizarSuscripcionUsuario('${u._id}', true, 'premium')">Premium</button>
        <button class="danger-btn" onclick="actualizarSuscripcionUsuario('${u._id}', false, 'ninguno')">Desactivar</button>
      </div>
    </article>
  `;
});

  } catch (error) {
    console.error('Error admin usuarios:', error);
  }
}
async function cargarServiciosAdmin() {
  try {
    const cont = document.getElementById('admin-servicios');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/admin/servicios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const servicios = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${servicios.error || 'No se pudieron cargar servicios.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    servicios.forEach((s) => {
  const imagenes = s.imagenes && s.imagenes.length ? s.imagenes : [s.imagen];

  cont.innerHTML += `
    <article class="admin-service-card">
      <div class="admin-service-gallery">
        ${imagenes.map(img => `
          <img src="${optimizarImagen(img)}" alt="${s.nombre}" loading="lazy">
        `).join('')}
      </div>

      <div class="admin-service-content">
        <div class="admin-card-top">
          <div>
            <h3>${s.nombre}</h3>
            <p>Servicio publicado</p>
          </div>

          <span class="service-price">$${Number(s.precio).toLocaleString('es-CL')}</span>
        </div>

        <p><b>Propietario:</b> ${s.propietarioId?.username || 'Sin propietario'}</p>
        <p><b>Rol:</b> ${s.propietarioId?.role || 'No disponible'}</p>
      </div>
    </article>
  `;
});

  } catch (error) {
    console.error('Error admin servicios:', error);
  }
}
async function cargarReservasAdmin() {
  const cont = document.getElementById('admin-reservas');
  if (!cont) return;

  try {
    cont.innerHTML = '<p>Cargando reservas...</p>';

    const token = localStorage.getItem('token');

    if (!token) {
      cont.innerHTML = '<p>No hay sesión activa. Inicia sesión nuevamente.</p>';
      return;
    }

    const res = await fetch(`${API_URL}/admin/reservas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${data.error || 'No se pudieron cargar las reservas.'}</p>`;
      return;
    }

    const reservas = Array.isArray(data) ? data : [];
    const filtroTexto = document.getElementById('filtroReservaTexto');
const filtroEstado = document.getElementById('filtroReservaEstado');

let reservasFiltradas = [...reservas];

const aplicarFiltros = () => {
  const texto = (filtroTexto?.value || '').toLowerCase();
  const estadoFiltro = (filtroEstado?.value || '').toLowerCase();

  reservasFiltradas = reservas.filter((r) => {
    const cliente = (
      r.nombreCliente ||
      r.usuarioId?.username ||
      ''
    ).toLowerCase();

    const servicio = (
      r.servicio ||
      r.servicioId?.nombre ||
      ''
    ).toLowerCase();

    const estado = (r.estado || '').toLowerCase();

    const coincideTexto =
      cliente.includes(texto) ||
      servicio.includes(texto);

    const coincideEstado =
      !estadoFiltro || estado === estadoFiltro;

    return coincideTexto && coincideEstado;
  });

  renderReservasAdmin(reservasFiltradas);
};

if (filtroTexto) {
  filtroTexto.oninput = aplicarFiltros;
}

if (filtroEstado) {
  filtroEstado.onchange = aplicarFiltros;
}
    const alertasAdmin = document.getElementById('admin-alertas');

if (alertasAdmin) {
  const pendientesRevision = reservas.filter(
    r => (r.estado || '').toLowerCase() === 'pendiente'
  ).length;

  if (pendientesRevision > 0) {
    alertasAdmin.innerHTML = `
      <div class="admin-alert warning">
        ⚠️ Tienes ${pendientesRevision} reserva${pendientesRevision > 1 ? 's' : ''} pendiente${pendientesRevision > 1 ? 's' : ''} por revisar.
      </div>
    `;
  } else {
    alertasAdmin.innerHTML = `
      <div class="admin-alert success">
        ✅ No existen reservas pendientes por revisar.
      </div>
    `;
  }
}
    const tablaRecientes = document.getElementById('tabla-reservas-recientes');

if (tablaRecientes) {
  const recientes = [...reservas]
    .reverse()
    .slice(0, 5);

  tablaRecientes.innerHTML = recientes.map(r => {
    const cliente =
      r.nombreCliente ||
      r.usuarioId?.username ||
      'Cliente no disponible';

    const servicio =
      r.servicio ||
      r.servicioId?.nombre ||
      'Servicio';

    const estado = r.estado || 'pendiente';

    return `
      <div class="recent-row">
        <div>
          <strong>${cliente}</strong><br>
          <small>${servicio}</small>
        </div>

        <div>
          <span class="status-badge status-${estado}">
            ${estado}
          </span>
        </div>
      </div>
    `;
  }).join('');
}
const listaTopServicios = document.getElementById('lista-top-servicios');

if (listaTopServicios) {
  const conteoServicios = {};

  reservas.forEach((r) => {
    const servicio =
      r.servicio ||
      r.servicioId?.nombre ||
      'Servicio no disponible';

    conteoServicios[servicio] = (conteoServicios[servicio] || 0) + 1;
  });

  const topServicios = Object.entries(conteoServicios)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topServicios.length === 0) {
    listaTopServicios.innerHTML = '<p>No hay datos suficientes.</p>';
  } else {
    listaTopServicios.innerHTML = topServicios.map(([servicio, total], index) => `
      <div class="top-service-row">
        <div>
          <strong>${index + 1}. ${servicio}</strong>
          <p>${total} reserva${total !== 1 ? 's' : ''}</p>
        </div>

        <span>${total}</span>
      </div>
    `).join('');
  }
}
const canvasIngresos = document.getElementById('graficoIngresosAdmin');

if (canvasIngresos && typeof Chart !== 'undefined') {
  const ingresosPorMes = {};

  reservas.forEach((r) => {
    const estado = (r.estado || '').toLowerCase();

    if (estado !== 'confirmada') return;

    const fechaBase = r.fechaInicio || r.createdAt;
    if (!fechaBase) return;

    const fecha = new Date(fechaBase);

    if (isNaN(fecha.getTime())) return;

    const mes = fecha.toLocaleDateString('es-CL', {
      month: 'short',
      year: 'numeric'
    });

    const monto =
      Number(r.montoPagado) ||
      Number(r.montoTotal) ||
      Number(r.precio) ||
      Number(r.servicioId?.precio) ||
      0;

    ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + monto;
  });

  const labels = Object.keys(ingresosPorMes);
  const valores = Object.values(ingresosPorMes);

  if (window.graficoIngresosAdminInstance) {
    window.graficoIngresosAdminInstance.destroy();
  }

  window.graficoIngresosAdminInstance = new Chart(canvasIngresos, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Ingresos confirmados',
        data: valores
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString('es-CL');
            }
          }
        }
      }
    }
  });
}

    const statReservas = document.getElementById('admin-stat-reservas');
    const statIngresos = document.getElementById('admin-stat-ingresos');

    if (statReservas) {
      statReservas.textContent = reservas.length;
    }

    let ingresos = 0;
    let confirmadas = 0;
    let pendientes = 0;
    let ticketPromedio = 0;
    let pagosFallidos = 0;

    reservas.forEach((r) => {
  const estado = (r.estado || '').toLowerCase();

  const precio =
    Number(r.montoPagado) ||
    Number(r.montoTotal) ||
    Number(r.precio) ||
    Number(r.servicioId?.precio) ||
    0;

  if (estado === 'confirmada') {
    confirmadas++;
    ingresos += precio;
  }
  if (confirmadas > 0) {
  ticketPromedio = ingresos / confirmadas;
}

  if (estado === 'pendiente') {
    pendientes++;
  }
  if ((r.pagoEstado || '').toLowerCase() === 'fallido') {
  pagosFallidos++;
}
});

    if (statIngresos) {
      statIngresos.textContent = `$${ingresos.toLocaleString('es-CL')}`;
    }
    const statConfirmadas = document.getElementById('admin-stat-confirmadas');
const statPendientes = document.getElementById('admin-stat-pendientes');
const statTicket = document.getElementById('admin-stat-ticket');
const statPagosFallidos = document.getElementById('admin-stat-pagos-fallidos');

if (statConfirmadas) {
  statConfirmadas.textContent = confirmadas;
}

if (statPendientes) {
  statPendientes.textContent = pendientes;
}
if (statTicket) {
  statTicket.textContent =
    `$${Math.round(ticketPromedio).toLocaleString('es-CL')}`;
}

    if (reservas.length === 0) {
      renderReservasAdmin(reservasFiltradas);
      return;
    }
    if (statPagosFallidos) {
  statPagosFallidos.textContent = pagosFallidos;
}

    cont.innerHTML = reservas.map((r) => {
      const estado = r.estado || 'pendiente';

      const servicio =
        r.servicio ||
        r.servicioId?.nombre ||
        'Servicio no disponible';

      const cliente =
        r.nombreCliente ||
        r.usuarioId?.username ||
        'Cliente no disponible';

      const email =
        r.emailCliente ||
        r.usuarioId?.email ||
        'Correo no disponible';

      const telefono =
        r.telefonoCliente ||
        'Teléfono no disponible';

      const fechaInicio = r.fechaInicio
        ? new Date(r.fechaInicio).toLocaleDateString('es-CL')
        : 'No disponible';

      const fechaFin = r.fechaFin
        ? new Date(r.fechaFin).toLocaleDateString('es-CL')
        : 'No disponible';

      const precio =
        Number(r.montoTotal) ||
        Number(r.precio) ||
        Number(r.servicioId?.precio) ||
        0;

      return `
        <article class="admin-reservation-card">
          <div class="admin-card-top">
            <div>
              <h3>${servicio}</h3>
              <p>Reserva generada desde TurismoGO</p>
            </div>

            <span class="status-badge status-${estado}">
              ${estado}
            </span>
          </div>

          <div class="admin-user-info">
            <p><b>Cliente:</b> ${cliente}</p>
            <p><b>Correo:</b> ${email}</p>
            <p><b>Teléfono:</b> ${telefono}</p>
            <p><b>Fecha inicio:</b> ${fechaInicio}</p>
            <p><b>Fecha fin:</b> ${fechaFin}</p>
            <p><b>Personas:</b> ${r.personas || 1}</p>
            <p><b>Monto:</b> $${precio.toLocaleString('es-CL')}</p>
          </div>
          <div class="admin-card-actions">
  <button onclick="actualizarEstadoReservaAdmin('${r._id}', 'confirmada')" class="btn-admin-confirmar">
    Confirmar
  </button>

  <button onclick="actualizarEstadoReservaAdmin('${r._id}', 'rechazada')" class="btn-admin-rechazar">
    Rechazar
  </button>

  <button onclick="actualizarEstadoReservaAdmin('${r._id}', 'cancelada')" class="btn-admin-cancelar">
    Cancelar
  </button>
</div>
        </article>
      `;
    }).join('');

  } catch (error) {
    console.error('Error admin reservas:', error);
    cont.innerHTML = '<p>Error al cargar las reservas del administrador.</p>';
  }
}
async function cambiarRolUsuario(usuarioId, nuevoRole) {
  try {
    const confirmar = await customConfirm(`¿Seguro que deseas cambiar este usuario a ${nuevoRole}?`);

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: nuevoRole })
    });

    const data = await res.json();

    if (!res.ok) {
     mostrarAlerta(data.error || 'No se pudo cambiar el rol');
      return;
    }

    mostrarAlerta(data.message || 'Rol actualizado correctamente');

    cargarUsuariosAdmin();
  } catch (error) {
    console.error('Error al cambiar rol:', error);
   mostrarAlerta('Error al cambiar rol');
  }
}
async function actualizarSuscripcionUsuario(usuarioId, suscripcionActiva, plan) {
  try {
    const confirmar = await customConfirm(`¿Actualizar suscripción a ${plan}?`);

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}/suscripcion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        suscripcionActiva,
        plan
      })
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No se pudo actualizar la suscripción');
      return;
    }

   mostrarAlerta(data.message || 'Suscripción actualizada correctamente');

    cargarUsuariosAdmin();
  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    mostrarAlerta('Error al actualizar suscripción');
  }
}
async function exportarReservasAdmin() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      mostrarAlerta('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    const res = await fetch(`${API_URL}/admin/reservas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const reservas = await res.json();

    if (!res.ok) {
      mostrarAlerta(reservas.error || 'No se pudieron exportar las reservas.');
      return;
    }

    if (!Array.isArray(reservas) || reservas.length === 0) {
     mostrarAlerta('No hay reservas para exportar.');
      return;
    }

    const filas = reservas.map((r) => ({
      Cliente: r.nombreCliente || r.usuarioId?.username || 'No disponible',
      Email: r.emailCliente || r.usuarioId?.email || 'No disponible',
      Telefono: r.telefonoCliente || 'No disponible',
      Servicio: r.servicio || r.servicioId?.nombre || 'No disponible',
      FechaInicio: r.fechaInicio || 'No disponible',
      FechaFin: r.fechaFin || 'No disponible',
      Personas: r.personas || 'No informado',
      EstadoReserva: r.estado || 'pendiente',
      EstadoPago: r.pagoEstado || 'pendiente',
      Monto: r.montoPagado || r.servicioId?.precio || 0
    }));

    const encabezados = Object.keys(filas[0]);

    const csv = [
      encabezados.join(';'),
      ...filas.map(fila =>
        encabezados.map(campo => `"${String(fila[campo]).replace(/"/g, '""')}"`).join(';')
      )
    ].join('\n');

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `reservas-turismogo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exportando reservas:', error);
   mostrarAlerta('Error al exportar reservas.');
  }
}
async function exportarReservasPDFAdmin() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
     mostrarAlerta('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    const res = await fetch(`${API_URL}/admin/reservas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const reservas = await res.json();

    if (!res.ok) {
     mostrarAlerta(reservas.error || 'No se pudieron exportar las reservas.');
      return;
    }

    if (!Array.isArray(reservas) || reservas.length === 0) {
      mostrarAlerta('No hay reservas para exportar.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('TurismoGO - Reporte de Reservas', 14, 20);

    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}`, 14, 28);

    let y = 40;

    reservas.forEach((r, index) => {
      const cliente = r.nombreCliente || r.usuarioId?.username || 'No disponible';
      const servicio = r.servicio || r.servicioId?.nombre || 'No disponible';
      const estado = r.estado || 'pendiente';
      const pago = r.pagoEstado || 'pendiente';
      const monto = Number(r.montoPagado || r.servicioId?.precio || 0);

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text(`${index + 1}. ${servicio}`, 14, y);

      doc.setFontSize(10);
      doc.text(`Cliente: ${cliente}`, 14, y + 7);
      doc.text(`Estado reserva: ${estado}`, 14, y + 14);
      doc.text(`Estado pago: ${pago}`, 14, y + 21);
      doc.text(`Monto: $${monto.toLocaleString('es-CL')}`, 14, y + 28);
      doc.text(`Fechas: ${r.fechaInicio || 'N/D'} al ${r.fechaFin || 'N/D'}`, 14, y + 35);

      y += 48;
    });

    doc.save(`reservas-turismogo-${new Date().toISOString().slice(0, 10)}.pdf`);

  } catch (error) {
    console.error('Error exportando PDF:', error);
   mostrarAlerta('Error al exportar PDF.');
  }
}
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
async function solicitarReservaPublica() {
  try {
    const fechaInicio = document.getElementById('detalle-inicio').value;
    const fechaFin = document.getElementById('detalle-fin').value;
    const personas = document.getElementById('detalle-personas').value;

    const nombreCliente = document.getElementById('detalle-nombre-cliente').value.trim();
    const emailCliente = document.getElementById('detalle-email-cliente').value.trim();
    const telefonoCliente = document.getElementById('detalle-telefono-cliente').value.trim();
    const mensajeCliente = document.getElementById('detalle-mensaje-cliente').value.trim();

    if (!fechaInicio || !fechaFin || !nombreCliente || !emailCliente) {
      mostrarAlerta('Debe completar nombre, correo electrónico y fechas de reserva.');
      return;
    }

    const res = await fetch(`${API_URL}/reserva-publica/pagar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        servicioId: servicioActualId,
        fechaInicio,
        fechaFin,
        personas,
        nombreCliente,
        emailCliente,
        telefonoCliente,
        mensajeCliente
      })
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No fue posible iniciar el proceso de pago.');
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
    console.error('Error en pago de reserva pública:', error);
    mostrarAlerta('Ocurrió un error al iniciar el pago.');
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
              <h3>${s.nombre}</h3>
              <p>${s.descripcion}</p>

              <div class="trust-row">
                <span>★ 5.0</span>
                <span>Proveedor TurismoGO</span>
              </div>

              <p class="public-price">
                $${Number(s.precio).toLocaleString('es-CL')}
              </p>

              <button class="btn-ver-servicio" data-id="${s._id}">
  Ver aviso
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

    if (cacheServicios) {
      try {
        servicios = JSON.parse(cacheServicios);

        if (Array.isArray(servicios) && servicios.length > 0) {
          renderizarServicios(servicios);
        }
      } catch (error) {
        console.warn('Cache inválida:', error);
        localStorage.removeItem('turismogo_servicios_cache');
      }
    }

    // 👇 FETCH REAL
    const res = await fetch(`${API_URL}/servicios`);
    const serviciosActualizados = await res.json();

    if (!res.ok || !Array.isArray(serviciosActualizados)) {
      if (!servicios.length) {
        cont.innerHTML = `<p>Error al cargar servicios.</p>`;
      }
      return;
    }

    servicios = serviciosActualizados;

    // 👇 GUARDAR CACHE
    localStorage.setItem(
      'turismogo_servicios_cache',
      JSON.stringify(serviciosActualizados)
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
async function actualizarEstadoReservaAdmin(idReserva, nuevoEstado) {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
     mostrarAlerta('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    const confirmar = await customConfirm(`¿Deseas cambiar esta reserva a "${nuevoEstado}"?`);

    if (!confirmar) return;

    const res = await fetch(`${API_URL}/reservas/${idReserva}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        estado: nuevoEstado
      })
    });

    const data = await res.json();

    if (!res.ok) {
     mostrarAlerta(data.error || 'No se pudo actualizar la reserva.');
      return;
    }

   mostrarAlerta('Reserva actualizada correctamente.');
    cargarReservasAdmin();

  } catch (error) {
    console.error('Error al actualizar reserva:', error);
   mostrarAlerta('Error al actualizar la reserva.');
  }
}
function renderReservasAdmin(reservas) {
  const cont = document.getElementById('admin-reservas');
  if (!cont) return;

  if (reservas.length === 0) {
    cont.innerHTML = '<p>No se encontraron reservas.</p>';
    return;
  }

  cont.innerHTML = reservas.map((r) => {
    // aquí pegas el return actual completo
  }).join('');
}
async function eliminarUsuarioAdmin(usuarioId, username) {
  try {
    const confirmar = await customConfirm(
  `¿Seguro que deseas eliminar al usuario "${username}"?\n\nEsta acción no se puede deshacer.`
);

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No se pudo eliminar el usuario');
      return;
    }

    mostrarAlerta(data.message || 'Usuario eliminado correctamente');

    cargarUsuariosAdmin();
    cargarServiciosAdmin();
    cargarReservasAdmin();

  } catch (error) {
    console.error('Error eliminando usuario:', error);
   mostrarAlerta('Error al eliminar usuario');
  }
}
async function cargarCalendarioPropietario() {
  try {
    const cont = document.getElementById('calendario-propietario');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/reservas-propietario`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const reservas = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${reservas.error || 'No se pudo cargar el calendario.'}</p>`;
      return;
    }

    const reservasActivas = Array.isArray(reservas)
      ? reservas.filter(r => ['pendiente', 'confirmada'].includes((r.estado || '').toLowerCase()))
      : [];

    if (reservasActivas.length === 0) {
      cont.innerHTML = `
        <div class="calendar-empty">
          <h3>No hay servicios ocupados actualmente</h3>
          <p>Cuando existan reservas pendientes o confirmadas, aparecerán aquí.</p>
        </div>
      `;
      return;
    }

    reservasActivas.sort((a, b) => {
      return new Date(a.fechaInicio) - new Date(b.fechaInicio);
    });

    cont.innerHTML = `
      <div class="calendar-table">
        <div class="calendar-row calendar-head">
          <span>Servicio</span>
          <span>Cliente</span>
          <span>Inicio</span>
          <span>Fin</span>
          <span>Reserva</span>
          <span>Pago</span>
        </div>

        ${reservasActivas.map((r) => {
          const servicio = r.servicio || r.servicioId?.nombre || 'Servicio no disponible';
          const cliente = r.nombreCliente || r.usuarioId?.username || 'Cliente externo';
          const estado = r.estado || 'pendiente';
          const pago = r.pagoEstado || 'pendiente';

          return `
            <div class="calendar-row">
              <span>
                <strong>${servicio}</strong>
              </span>

              <span>${cliente}</span>

              <span>${formatearFechaCalendario(r.fechaInicio)}</span>

              <span>${formatearFechaCalendario(r.fechaFin)}</span>

              <span>
                <b class="status-badge status-${estado}">
                  ${estado}
                </b>
              </span>

              <span>
                <b class="payment-badge payment-${pago}">
                  ${pago}
                </b>
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;

  } catch (error) {
    console.error('Error calendario propietario:', error);
  }
}

function formatearFechaCalendario(fecha) {
  if (!fecha) return 'No disponible';

  const fechaObj = new Date(fecha);

  if (isNaN(fechaObj.getTime())) {
    return fecha;
  }

  return fechaObj.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
function toggleDetalleReserva(reservaId) {
  const detalle = document.getElementById(`detalle-reserva-${reservaId}`);

  if (!detalle) return;

  detalle.classList.toggle('reservation-details-visible');
}
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
async function cargarMensajesPropietario() {
  try {
    const cont = document.getElementById('mensajes-propietario');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/mensajes-propietario`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const mensajes = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${mensajes.error || 'No se pudieron cargar los mensajes.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      cont.innerHTML = `
        <div class="empty-owner-state">
          <h3>No tienes mensajes recibidos</h3>
          <p>Cuando un cliente consulte por un servicio, aparecerá aquí.</p>
        </div>
      `;
      return;
    }

    mensajes.forEach((m) => {
      const fecha = m.fecha
        ? new Date(m.fecha).toLocaleDateString('es-CL')
        : 'Fecha no disponible';

      cont.innerHTML += `
        <article class="owner-message-card">
          <div>
            <span class="reservation-label">Consulta recibida</span>
            <h3>${m.servicioId?.nombre || 'Servicio no disponible'}</h3>
            <p>${fecha}</p>
          </div>

          <div class="owner-client-box">
            <div>
              <span>Cliente</span>
              <strong>${m.nombreCliente}</strong>
            </div>

            <div>
              <span>Correo</span>
              <strong>${m.emailCliente}</strong>
            </div>
          </div>

          <div class="owner-message-box">
            <span>Mensaje</span>
            <p>${m.mensaje}</p>
          </div>

          <a class="reply-mail-btn" href="mailto:${m.emailCliente}?subject=Respuesta desde TurismoGO">
            Responder por correo
          </a>
        </article>
      `;
    });

  } catch (error) {
    console.error('Error cargando mensajes:', error);
  }
}