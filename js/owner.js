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
    cargarStatsPropietario();
    cargarHistorialReservasPropietario();
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
let propietarioReservasPage = 1;
const propietarioReservasLimit = 50;

let propietarioReservasEstado = 'pendiente_pago,reembolso_pendiente';
let propietarioReservasPagoEstado = '';
let propietarioReservasBusqueda = '';
async function cargarReservasPropietario() {
  try {
    const cont = document.getElementById('reservas-propietario');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const params = new URLSearchParams({
  page: propietarioReservasPage,
  limit: propietarioReservasLimit
});

if (propietarioReservasEstado) {
  params.set('estado', propietarioReservasEstado);
}

if (propietarioReservasPagoEstado) {
  params.set('pagoEstado', propietarioReservasPagoEstado);
}

if (propietarioReservasBusqueda) {
  params.set('q', propietarioReservasBusqueda);
}

const res = await fetch(`${API_URL}/reservas-propietario?${params.toString()}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

    const data = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${data.error || 'No se pudieron cargar las reservas.'}</p>`;
      return;
    }

    const reservas = Array.isArray(data.reservas)
      ? data.reservas
      : Array.isArray(data)
        ? data
        : [];

    cont.innerHTML = '';

    if (reservas.length === 0) {
      cont.innerHTML = `
        <div class="empty-owner-state">
          <h3>No tienes reservas pendientes de gestión</h3>
          <p>Las reservas confirmadas aparecerán en el calendario de ocupación.</p>
        </div>
      `;
      return;
    }

  
    reservas.forEach((r) => {
      const estado = r.estado || 'pendiente_pago';
      const pagoEstado = r.pagoEstado || 'pendiente';

      const servicio = r.servicio || r.servicioId?.nombre || 'Servicio no disponible';

      const codigoReserva =
        r.codigoReserva ||
        `TG-${String(r._id || '').slice(-6).toUpperCase()}`;

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

      const fechaInicio = r.fechaInicio
        ? new Date(r.fechaInicio).toLocaleDateString('es-CL')
        : 'No disponible';

      const fechaFin = r.fechaFin
        ? new Date(r.fechaFin).toLocaleDateString('es-CL')
        : 'No disponible';

      const monto =
        Number(r.montoPagado) ||
        Number(r.montoTotal) ||
        Number(r.precio) ||
        Number(r.servicioId?.precio) ||
        0;

      const puedeGestionar = ['pendiente', 'pendiente_pago', 'reembolso_pendiente'].includes(estado);

      cont.innerHTML += `
        <article class="owner-reservation-card compact-reservation-card">
          <div class="owner-reservation-header">
            <div>
              <span class="reservation-label">${codigoReserva}</span>
              <h3>${servicio}</h3>
              <p>Reserva recibida desde TurismoGO</p>
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
            ${
              puedeGestionar && pagoEstado === 'pagado'
                ? `
                  <button
                    class="approve-btn"
                    onclick="cambiarEstadoReserva('${r._id}', 'confirmada')"
                  >
                    Confirmar
                  </button>
                `
                : ''
            }

            ${
              puedeGestionar
                ? `
                  <button
                    class="reject-btn"
                    onclick="cambiarEstadoReserva('${r._id}', 'rechazada')"
                  >
                    Rechazar
                  </button>
                `
                : ''
            }

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
                <strong>${fechaInicio}</strong>
              </div>

              <div>
                <span>Fecha fin</span>
                <strong>${fechaFin}</strong>
              </div>

              <div>
                <span>Voucher</span>
                <strong>${r.voucherEnviado ? 'Enviado' : 'Pendiente'}</strong>
              </div>
            </div>

            <div class="reservation-money-box">
              <div class="money-item">
                <span>Valor reserva</span>
                <strong>$${Number(monto || 0).toLocaleString('es-CL')}</strong>
              </div>

              <div class="money-item">
                <span>Comisión TurismoGO</span>
                <strong class="money-commission">
                  ${r.comisionPorcentaje || 0}% ≈
                  $${Number(r.comisionTurismoGO || 0).toLocaleString('es-CL')}
                </strong>
              </div>

              <div class="money-item">
                <span>Monto líquido propietario</span>
                <strong class="money-owner">
                  $${Number(r.montoPropietario || 0).toLocaleString('es-CL')}
                </strong>
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
function aplicarFiltrosReservasPropietario() {
  const inputBusqueda = document.getElementById('filtroReservaPropietarioTexto');
  const selectEstado = document.getElementById('filtroReservaPropietarioEstado');
  const selectPago = document.getElementById('filtroReservaPropietarioPago');

  propietarioReservasBusqueda = inputBusqueda ? inputBusqueda.value.trim() : '';
  propietarioReservasEstado = selectEstado ? selectEstado.value : '';
  propietarioReservasPagoEstado = selectPago ? selectPago.value : '';

  propietarioReservasPage = 1;

  cargarReservasPropietario();
}
function limpiarFiltrosReservasPropietario() {
  const inputBusqueda = document.getElementById('filtroReservaPropietarioTexto');
  const selectEstado = document.getElementById('filtroReservaPropietarioEstado');
  const selectPago = document.getElementById('filtroReservaPropietarioPago');

  if (inputBusqueda) inputBusqueda.value = '';
  if (selectEstado) selectEstado.value = 'pendiente_pago,reembolso_pendiente';
  if (selectPago) selectPago.value = '';

  propietarioReservasBusqueda = '';
  propietarioReservasEstado = 'pendiente_pago,reembolso_pendiente';
  propietarioReservasPagoEstado = '';
  propietarioReservasPage = 1;

  cargarReservasPropietario();
}
async function cargarHistorialReservasPropietario() {
  try {
    const cont = document.getElementById('historial-reservas-propietario');
    if (!cont) return;

    const token = localStorage.getItem('token');

    if (!token) {
      cont.innerHTML = '<p>Sesión expirada. Inicia sesión nuevamente.</p>';
      return;
    }

    const estadosProcesados = [
      'confirmada',
      'rechazada',
      'cancelada',
      'expirada',
      'reembolsada'
    ].join(',');

    const res = await fetch(
      `${API_URL}/reservas-propietario?estado=${estadosProcesados}&page=1&limit=50`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${data.error || 'No se pudo cargar el historial.'}</p>`;
      return;
    }

    const reservas = Array.isArray(data.reservas)
      ? data.reservas
      : Array.isArray(data)
        ? data
        : [];

    if (reservas.length === 0) {
      cont.innerHTML = `
        <div class="empty-owner-state">
          <h3>No hay reservas procesadas todavía</h3>
          <p>Cuando confirmes, rechaces o canceles reservas, aparecerán aquí.</p>
        </div>
      `;
      return;
    }

    cont.innerHTML = reservas.map((r) => {
      const codigoReserva =
        r.codigoReserva ||
        `TG-${String(r._id || '').slice(-6).toUpperCase()}`;

      const servicio =
        r.servicio ||
        r.servicioId?.nombre ||
        'Servicio no disponible';

      const cliente =
        r.nombreCliente ||
        r.usuarioId?.username ||
        'Cliente externo';

      const email =
        r.emailCliente ||
        'Correo no informado';

      const fechaInicio = r.fechaInicio
        ? new Date(r.fechaInicio).toLocaleDateString('es-CL')
        : 'No disponible';

      const fechaFin = r.fechaFin
        ? new Date(r.fechaFin).toLocaleDateString('es-CL')
        : 'No disponible';

      const montoPropietario = Number(r.montoPropietario || 0);
      const comision = Number(r.comisionTurismoGO || 0);
      const montoPagado = Number(r.montoPagado || 0);

      return `
        <article class="owner-history-card">
          <div>
            <span class="reservation-label">${codigoReserva}</span>
            <h4>${servicio}</h4>
            <p>${cliente} · ${email}</p>
          </div>

          <div class="owner-history-meta">
            <span class="status-badge status-${r.estado || 'pendiente'}">
              ${r.estado || 'pendiente'}
            </span>

            <p><b>Pago:</b> ${r.pagoEstado || 'pendiente'}</p>
            <p><b>Fechas:</b> ${fechaInicio} al ${fechaFin}</p>
            <p><b>Monto pagado:</b> $${montoPagado.toLocaleString('es-CL')}</p>
            <p><b>Comisión TurismoGO:</b> $${comision.toLocaleString('es-CL')}</p>
            <p><b>Monto propietario:</b> $${montoPropietario.toLocaleString('es-CL')}</p>
          </div>
        </article>
      `;
    }).join('');

  } catch (error) {
    console.error('Error historial reservas propietario:', error);
  }
}
function toggleHistorialReservasPropietario() {
  const cont = document.getElementById('historial-reservas-propietario');
  const btn = document.getElementById('btn-toggle-historial-propietario');

  if (!cont || !btn) return;

  const estaOculto = cont.style.display === 'none' || !cont.style.display;

  if (estaOculto) {
    cont.style.display = 'block';
    btn.textContent = 'Ocultar historial';
  } else {
    cont.style.display = 'none';
    btn.textContent = 'Ver historial';
  }
}
function actualizarStatsPropietario(reservas = []) {
  const pendientes = reservas.filter(
    r => ['pendiente', 'pendiente_pago', 'reembolso_pendiente'].includes((r.estado || '').toLowerCase())
  ).length;

  const confirmadas = reservas.filter(
    r => (r.estado || '').toLowerCase() === 'confirmada'
  ).length;

  const ingresos = reservas
    .filter(r => (r.estado || '').toLowerCase() === 'confirmada')
    .reduce((acc, r) => acc + (Number(r.montoPropietario) || 0), 0);

  const statPendientes = document.getElementById('stat-pendientes');
  const statConfirmadas = document.getElementById('stat-confirmadas');
  const statIngresos = document.getElementById('stat-ingresos');

  if (statPendientes) statPendientes.textContent = pendientes;
  if (statConfirmadas) statConfirmadas.textContent = confirmadas;
  if (statIngresos) statIngresos.textContent = `$${ingresos.toLocaleString('es-CL')}`;
}
async function cargarStatsPropietario() {
  try {
    const token = localStorage.getItem('token');

    if (!token) return;

    const res = await fetch(`${API_URL}/propietario/reservas/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const stats = await res.json();

    if (!res.ok) {
      console.error('Error stats propietario:', stats.error);
      return;
    }

    const statPendientes = document.getElementById('stat-pendientes');
    const statConfirmadas = document.getElementById('stat-confirmadas');
    const statIngresos = document.getElementById('stat-ingresos');

    if (statPendientes) {
      statPendientes.textContent =
        Number(stats.pendientesPago || 0) + Number(stats.reembolsoPendiente || 0);
    }

    if (statConfirmadas) {
      statConfirmadas.textContent = Number(stats.confirmadas || 0);
    }

    if (statIngresos) {
      statIngresos.textContent =
        `$${Number(stats.montoPropietario || 0).toLocaleString('es-CL')}`;
    }

  } catch (error) {
    console.error('Error al cargar estadísticas del propietario:', error);
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
    cargarCalendarioPropietario();
    cargarNotificacionesPropietario();
    cargarStatsPropietario();
    cargarHistorialReservasPropietario();
  } catch (error) {
    console.error('Error al cambiar estado de reserva:', error);
   mostrarAlerta('Error al actualizar reserva');
  }
}
async function cargarCalendarioPropietario() {
  try {
    const cont = document.getElementById('calendario-propietario');
    if (!cont) return;

    const token = localStorage.getItem('token');

  const res = await fetch(`${API_URL}/reservas-propietario?estado=confirmada&page=1&limit=100`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await res.json();

if (!res.ok) {
  cont.innerHTML = `<p>${data.error || 'No se pudo cargar el calendario.'}</p>`;
  return;
}

const reservasConfirmadas = Array.isArray(data.reservas)
  ? data.reservas
  : Array.isArray(data)
    ? data.filter(r => (r.estado || '').toLowerCase() === 'confirmada')
    : [];

    if (reservasConfirmadas.length === 0) {
      cont.innerHTML = `
        <div class="calendar-empty">
          <h3>No hay reservas confirmadas actualmente</h3>
          <p>Cuando confirmes una reserva, aparecerá aquí como ocupación activa.</p>
        </div>
      `;
      return;
    }

    reservasConfirmadas.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));

    cont.innerHTML = `
      <div class="visual-calendar-grid">
        ${reservasConfirmadas.map((r) => {
          const servicio = r.servicio || r.servicioId?.nombre || 'Servicio no disponible';
          const cliente = r.nombreCliente || r.usuarioId?.username || 'Cliente externo';
          const pago = r.pagoEstado || 'pendiente';

          const monto =
            Number(r.montoPagado) ||
            Number(r.montoTotal) ||
            Number(r.precio) ||
            Number(r.servicioId?.precio) ||
            0;

          return `
            <article class="visual-calendar-card">
              <div class="visual-calendar-top">
                <span class="calendar-service-label">Reserva confirmada</span>
                <span class="payment-badge payment-${pago}">
                  ${pago}
                </span>
              </div>

              <h3>${servicio}</h3>

              <div class="calendar-date-range">
                <div>
                  <span>Inicio</span>
                  <strong>${formatearFechaCalendario(r.fechaInicio)}</strong>
                </div>

                <div>
                  <span>Fin</span>
                  <strong>${formatearFechaCalendario(r.fechaFin)}</strong>
                </div>
              </div>

              <div class="calendar-client-line">
                <span>Cliente</span>
                <strong>${cliente}</strong>
              </div>

              <button
                class="calendar-detail-btn"
                onclick="toggleDetalleCalendario('${r._id}')"
              >
                Ver detalles
              </button>

              <div id="detalle-calendario-${r._id}" class="calendar-detail-hidden">
                <div class="calendar-detail-grid">
                  <div><span>Cliente</span><strong>${cliente}</strong></div>
                  <div><span>Servicio</span><strong>${servicio}</strong></div>
                  <div><span>Estado pago</span><strong>${pago}</strong></div>
                  <div><span>Valor reserva</span><strong>$${monto.toLocaleString('es-CL')}</strong></div>
                  <div><span>Comisión TurismoGO</span><strong>${r.comisionPorcentaje || 0}% ≈ $${Number(r.comisionTurismoGO || 0).toLocaleString('es-CL')}</strong></div>
                  <div><span>Monto líquido propietario</span><strong>$${Number(r.montoPropietario || 0).toLocaleString('es-CL')}</strong></div>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;

  } catch (error) {
    console.error('Error calendario propietario:', error);
  }
}
function toggleDetalleReserva(reservaId) {
  const detalle = document.getElementById(`detalle-reserva-${reservaId}`);

  if (!detalle) return;

  detalle.classList.toggle('reservation-details-visible');
}
function toggleDetalleCalendario(reservaId) {
  const detalle = document.getElementById(`detalle-calendario-${reservaId}`);

  if (!detalle) return;

  detalle.classList.toggle('calendar-detail-visible');
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
window.toggleHistorialReservasPropietario = toggleHistorialReservasPropietario;
window.aplicarFiltrosReservasPropietario = aplicarFiltrosReservasPropietario;
window.limpiarFiltrosReservasPropietario = limpiarFiltrosReservasPropietario;