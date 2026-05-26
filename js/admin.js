let adminReservasPage = 1;
const adminReservasLimit = 50;

let adminReservasPagination = {
  total: 0,
  page: 1,
  limit: 50,
  pages: 1
};

let adminReservasEstado = 'pendiente_pago,reembolso_pendiente';
let adminReservasPagoEstado = '';
let adminReservasBusqueda = '';
let adminReportesFechaDesde = '';
let adminReportesFechaHasta = '';
let adminReportesPeriodo = '';

function mostrarPanelAdmin() {
  const role = localStorage.getItem('role');
  const panel = document.getElementById('panel-admin');

  if (!panel) return;

  if (role === 'admin') {
  panel.style.display = 'block';

  const selectEstadoReservas = document.getElementById('filtroReservaEstado');

  if (selectEstadoReservas) {
    selectEstadoReservas.value = 'pendiente_pago,reembolso_pendiente';
  }

  adminReservasEstado = 'pendiente_pago,reembolso_pendiente';

  cargarUsuariosAdmin();
  cargarServiciosAdmin();
  cargarStatsReservasAdmin();
  adminReservasEstado = 'pendiente_pago,reembolso_pendiente';

setTimeout(() => {
  const selectEstadoReservas = document.getElementById('filtroReservaEstado');

  if (selectEstadoReservas) {
    selectEstadoReservas.value = 'pendiente_pago,reembolso_pendiente';
  }
}, 100);
  cargarReservasAdmin();
  cargarReportesReservasAdmin();
  cargarStatsReservasAdmin();
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

  try {
    if (!cont) return;

    const token = localStorage.getItem('token');

    if (!token) {
      cont.innerHTML = '<p>Sesión expirada. Inicia sesión nuevamente.</p>';
      return;
    }

    const params = new URLSearchParams({
      page: adminReservasPage,
      limit: adminReservasLimit
    });

    if (adminReservasEstado) {
      params.set('estado', adminReservasEstado);
    }

    if (adminReservasPagoEstado) {
      params.set('pagoEstado', adminReservasPagoEstado);
    }

    if (adminReservasBusqueda) {
      params.set('q', adminReservasBusqueda);
    }

    const res = await fetch(`${API_URL}/admin/reservas?${params.toString()}`, {
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
      : [];

    adminReservasPagination = data.pagination || {
      total: reservas.length,
      page: 1,
      limit: adminReservasLimit,
      pages: 1
    };

    renderReservasAdmin(reservas);
    renderAdminReservasPagination();

  } catch (error) {
    console.error('Error admin reservas:', error);

    if (cont) {
      cont.innerHTML = '<p>Error al cargar las reservas del administrador.</p>';
    }
  }
}

async function cargarStatsReservasAdmin() {
  try {
    const cont = document.getElementById('admin-reservas-stats');

    if (!cont) return;

    const token = localStorage.getItem('token');

    if (!token) {
      cont.innerHTML = '';
      return;
    }

    const res = await fetch(`${API_URL}/admin/reservas/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const stats = await res.json();

    if (!res.ok) {
      cont.innerHTML = '';
      console.error('Error stats reservas admin:', stats.error);
      return;
    }

    cont.innerHTML = `
      <div class="admin-stat-card">
        <span>Pendientes de pago</span>
        <strong>${stats.pendientesPago || 0}</strong>
      </div>

      <div class="admin-stat-card warning">
        <span>Reembolso pendiente</span>
        <strong>${stats.reembolsoPendiente || 0}</strong>
      </div>

      <div class="admin-stat-card success">
        <span>Confirmadas</span>
        <strong>${stats.confirmadas || 0}</strong>
      </div>

      <div class="admin-stat-card muted">
        <span>Cerradas</span>
        <strong>${stats.cerradas || 0}</strong>
      </div>

      <div class="admin-stat-card total">
        <span>Total reservas</span>
        <strong>${stats.total || 0}</strong>
      </div>

      <div class="admin-stat-card total">
        <span>Ventas totales</span>
        <strong>$${Number(stats.ventasTotales || 0).toLocaleString('es-CL')}</strong>
      </div>

      <div class="admin-stat-card success">
        <span>Comisión TurismoGO</span>
        <strong>$${Number(stats.comisionTurismoGO || 0).toLocaleString('es-CL')}</strong>
      </div>

      <div class="admin-stat-card muted">
        <span>Monto propietarios</span>
        <strong>$${Number(stats.montoPropietarios || 0).toLocaleString('es-CL')}</strong>
      </div>
    `;

  } catch (error) {
    console.error('Error stats reservas admin:', error);
  }
}
async function cargarReportesReservasAdmin() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      mostrarAlerta('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    const estadosProcesados = [
      'confirmada',
      'rechazada',
      'cancelada',
      'expirada',
      'reembolsada'
    ].join(',');

   const params = new URLSearchParams({
  estado: estadosProcesados,
  page: 1,
  limit: 50
});

if (adminReportesFechaDesde) {
  params.set('fechaDesde', adminReportesFechaDesde);
}

if (adminReportesFechaHasta) {
  params.set('fechaHasta', adminReportesFechaHasta);
}

const res = await fetch(
  `${API_URL}/admin/reservas?${params.toString()}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No se pudieron cargar los reportes de reservas.');
      return;
    }

    const reservas = Array.isArray(data.reservas)
      ? data.reservas
      : [];

    renderReportesReservasAdmin(reservas, data.pagination);

  } catch (error) {
    console.error('Error reportes reservas admin:', error);
    mostrarAlerta('Error al cargar reportes de reservas.');
  }
}
function aplicarPeriodoReportesAdmin(periodo) {
  const hoy = new Date();

  adminReportesPeriodo = periodo;
  adminReportesFechaDesde = '';
  adminReportesFechaHasta = '';

  if (periodo === 'hoy') {
    const fecha = hoy.toISOString().slice(0, 10);
    adminReportesFechaDesde = fecha;
    adminReportesFechaHasta = fecha;
  }

  if (periodo === '7dias') {
    const desde = new Date();
    desde.setDate(hoy.getDate() - 7);

    adminReportesFechaDesde = desde.toISOString().slice(0, 10);
    adminReportesFechaHasta = hoy.toISOString().slice(0, 10);
  }

  if (periodo === 'mes') {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    adminReportesFechaDesde = desde.toISOString().slice(0, 10);
    adminReportesFechaHasta = hoy.toISOString().slice(0, 10);
  }

  const inputDesde = document.getElementById('reporteFechaDesde');
  const inputHasta = document.getElementById('reporteFechaHasta');

  if (inputDesde) inputDesde.value = adminReportesFechaDesde;
  if (inputHasta) inputHasta.value = adminReportesFechaHasta;

  cargarReportesReservasAdmin();
}
function aplicarRangoReportesAdmin() {
  const inputDesde = document.getElementById('reporteFechaDesde');
  const inputHasta = document.getElementById('reporteFechaHasta');

  adminReportesFechaDesde = inputDesde ? inputDesde.value : '';
  adminReportesFechaHasta = inputHasta ? inputHasta.value : '';
  adminReportesPeriodo = 'personalizado';

  cargarReportesReservasAdmin();
}
function limpiarFiltrosReportesAdmin() {
  adminReportesFechaDesde = '';
  adminReportesFechaHasta = '';
  adminReportesPeriodo = '';

  const inputDesde = document.getElementById('reporteFechaDesde');
  const inputHasta = document.getElementById('reporteFechaHasta');

  if (inputDesde) inputDesde.value = '';
  if (inputHasta) inputHasta.value = '';

  cargarReportesReservasAdmin();
}

function renderReportesReservasAdmin(reservas, pagination = {}) {
  const cont = document.getElementById('admin-reportes-reservas');

  if (!cont) return;

  if (!Array.isArray(reservas) || reservas.length === 0) {
    cont.innerHTML = `
      <div class="admin-empty-state">
        No hay reservas procesadas para mostrar.
      </div>
    `;
    return;
  }

  const formatearMonto = (valor) => {
    const numero = Number(valor) || 0;
    return `$${numero.toLocaleString('es-CL')}`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const totalVentas = reservas.reduce((acc, r) => acc + (Number(r.montoPagado) || 0), 0);
  const totalComision = reservas.reduce((acc, r) => acc + (Number(r.comisionTurismoGO) || 0), 0);
  const totalPropietario = reservas.reduce((acc, r) => acc + (Number(r.montoPropietario) || 0), 0);

  cont.innerHTML = `
    <div class="admin-report-summary">
      <div>
        <span>Total reservas procesadas</span>
        <strong>${pagination.total || reservas.length}</strong>
      </div>

      <div>
        <span>Ventas cargadas</span>
        <strong>${formatearMonto(totalVentas)}</strong>
      </div>

      <div>
        <span>Comisión TurismoGO</span>
        <strong>${formatearMonto(totalComision)}</strong>
      </div>

      <div>
        <span>Monto propietarios</span>
        <strong>${formatearMonto(totalPropietario)}</strong>
      </div>
    </div>

    <div class="admin-report-list">
      ${reservas.map((r) => {
        const codigoReserva =
          r.codigoReserva ||
          `TG-${String(r._id || '').slice(-6).toUpperCase()}`;

        return `
          <article class="admin-report-card">
            <div>
              <span class="admin-reservation-code">${codigoReserva}</span>
              <h4>${r.servicio || r.servicioId?.nombre || 'Servicio no disponible'}</h4>
              <p>${r.nombreCliente || r.usuarioId?.username || 'Cliente no disponible'} · ${r.emailCliente || 'Correo no disponible'}</p>
            </div>

            <div class="admin-report-meta">
              <span class="status-badge status-${r.estado || 'pendiente'}">
                ${r.estado || 'pendiente'}
              </span>
              <p><b>Pago:</b> ${r.pagoEstado || 'pendiente'}</p>
              <p><b>Fechas:</b> ${formatearFecha(r.fechaInicio)} al ${formatearFecha(r.fechaFin)}</p>
              <p><b>Monto:</b> ${formatearMonto(r.montoPagado)}</p>
              <p><b>Comisión:</b> ${formatearMonto(r.comisionTurismoGO)}</p>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderReservasAdmin(reservas) {
  const cont = document.getElementById('admin-reservas');

  if (!cont) return;

  if (!Array.isArray(reservas) || reservas.length === 0) {
    cont.innerHTML = '<p>No se encontraron reservas.</p>';
    return;
  }

  const formatearMonto = (valor) => {
    const numero = Number(valor) || 0;
    return `$${numero.toLocaleString('es-CL')}`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-CL');
  };

  const normalizarTextoEstado = (valor) => {
    const estados = {
      pendiente: 'Pendiente',
      pendiente_pago: 'Pendiente de pago',
      confirmada: 'Confirmada',
      rechazada: 'Rechazada',
      cancelada: 'Cancelada',
      expirada: 'Expirada',
      reembolso_pendiente: 'Reembolso pendiente',
      reembolsada: 'Reembolsada'
    };

    return estados[valor] || valor || 'Pendiente';
  };

  const normalizarPagoEstado = (valor) => {
    const estados = {
      pendiente: 'Pendiente',
      pagado: 'Pagado',
      fallido: 'Fallido'
    };

    return estados[valor] || valor || 'Pendiente';
  };

  cont.innerHTML = reservas.map((r) => {
    const estado = r.estado || 'pendiente';
    const pagoEstado = r.pagoEstado || 'pendiente';

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

    const fechaInicio = formatearFecha(r.fechaInicio);
    const fechaFin = formatearFecha(r.fechaFin);

    const monto =
      Number(r.montoPagado) ||
      Number(r.montoTotal) ||
      Number(r.precio) ||
      Number(r.servicioId?.precio) ||
      0;

    const codigoReserva =
      r.codigoReserva ||
      `TG-${String(r._id || '').slice(-6).toUpperCase()}`;

    const comisionTurismoGO = Number(r.comisionTurismoGO) || 0;
    const montoPropietario = Number(r.montoPropietario) || 0;
    const voucherTexto = r.voucherEnviado ? 'Enviado' : 'Pendiente';

    const mostrarConfirmar = ![
      'confirmada',
      'expirada',
      'reembolso_pendiente',
      'reembolsada'
    ].includes(estado);

    const mostrarRechazar = ![
      'confirmada',
      'rechazada',
      'cancelada',
      'expirada',
      'reembolso_pendiente',
      'reembolsada'
    ].includes(estado);

    const mostrarCancelar = ![
      'cancelada',
      'expirada',
      'reembolsada'
    ].includes(estado);

    const mostrarReembolsar =
  estado === 'reembolso_pendiente' &&
  localStorage.getItem('role') === 'admin';

    const alertaReembolso = estado === 'reembolso_pendiente'
      ? `
        <div class="admin-reservation-alert">
          ⚠ Pago autorizado con conflicto de disponibilidad. Requiere revisión administrativa o gestión de reembolso.
        </div>
      `
      : '';

    return `
      <article class="admin-reservation-card">

        <div class="admin-card-top">
          <div>
            <span class="admin-reservation-code">${codigoReserva}</span>
            <h3>${servicio}</h3>
            <p>Reserva generada desde TurismoGO</p>
          </div>

          <span class="status-badge status-${estado}">
            ${normalizarTextoEstado(estado)}
          </span>
        </div>

        ${alertaReembolso}

        <div class="admin-user-info">
          <p><b>Cliente:</b> ${cliente}</p>
          <p><b>Correo:</b> ${email}</p>
          <p><b>Teléfono:</b> ${telefono}</p>
          <p><b>Fecha inicio:</b> ${fechaInicio}</p>
          <p><b>Fecha fin:</b> ${fechaFin}</p>
          <p><b>Personas:</b> ${r.personas || 1}</p>
        </div>

        <div class="admin-reservation-finance">
          <p><b>Estado pago:</b> ${normalizarPagoEstado(pagoEstado)}</p>
          <p><b>Monto pagado:</b> ${formatearMonto(monto)}</p>
          <p><b>Comisión TurismoGO:</b> ${formatearMonto(comisionTurismoGO)}</p>
          <p><b>Monto propietario:</b> ${formatearMonto(montoPropietario)}</p>
          <p><b>Voucher:</b> ${voucherTexto}</p>
        </div>

        <div class="admin-card-actions">

          ${
            mostrarConfirmar
              ? `
                <button
                  onclick="actualizarEstadoReservaAdmin('${r._id}', 'confirmada')"
                  class="btn-admin-confirmar"
                >
                  Confirmar
                </button>
              `
              : ''
          }

          ${
            mostrarRechazar
              ? `
                <button
                  onclick="actualizarEstadoReservaAdmin('${r._id}', 'rechazada')"
                  class="btn-admin-rechazar"
                >
                  Rechazar
                </button>
              `
              : ''
          }

          ${
            mostrarCancelar
              ? `
                <button
                  onclick="actualizarEstadoReservaAdmin('${r._id}', 'cancelada')"
                  class="btn-admin-cancelar"
                >
                  Cancelar
                </button>
              `
              : ''
          }

          ${
  mostrarReembolsar
    ? `
      <button
        onclick="actualizarEstadoReservaAdmin('${r._id}', 'reembolsada')"
        class="btn-admin-reembolsar"
      >
        Marcar reembolsada
      </button>
    `
    : ''
}

        </div>

      </article>
    `;
  }).join('');
}

function renderAdminReservasPagination() {
  const contenedor = document.getElementById('admin-reservas-pagination');

  if (!contenedor) return;

  const { total, page, pages, limit } = adminReservasPagination;

  if (!total || pages <= 1) {
    contenedor.innerHTML = `
      <div class="admin-pagination-summary">
        Mostrando ${total || 0} reservas
      </div>
    `;
    return;
  }

  contenedor.innerHTML = `
    <div class="admin-pagination-box">
      <button 
        class="btn-secondary"
        onclick="cambiarPaginaReservasAdmin(${page - 1})"
        ${page <= 1 ? 'disabled' : ''}
      >
        ← Anterior
      </button>

      <div class="admin-pagination-summary">
        Página ${page} de ${pages} · ${total} reservas · ${limit} por página
      </div>

      <button 
        class="btn-secondary"
        onclick="cambiarPaginaReservasAdmin(${page + 1})"
        ${page >= pages ? 'disabled' : ''}
      >
        Siguiente →
      </button>
    </div>
  `;
}

function cambiarPaginaReservasAdmin(nuevaPagina) {
  if (nuevaPagina < 1 || nuevaPagina > adminReservasPagination.pages) return;

  adminReservasPage = nuevaPagina;
  cargarReservasAdmin();
}
function aplicarFiltrosReservasBackendAdmin() {
  const inputBusqueda = document.getElementById('filtroReservaTexto');
  const selectEstado = document.getElementById('filtroReservaEstado');
  const selectPagoEstado = document.getElementById('filtroReservaPagoEstado');

  adminReservasBusqueda = inputBusqueda ? inputBusqueda.value.trim() : '';
  adminReservasEstado = selectEstado ? selectEstado.value : '';
  adminReservasPagoEstado = selectPagoEstado ? selectPagoEstado.value : '';

  adminReservasPage = 1;

  cargarReservasAdmin();
}
function limpiarFiltrosReservasBackendAdmin() {
  const inputBusqueda = document.getElementById('filtroReservaTexto');
  const selectEstado = document.getElementById('filtroReservaEstado');
  const selectPagoEstado = document.getElementById('filtroReservaPagoEstado');

  if (inputBusqueda) inputBusqueda.value = '';
  if (selectEstado) selectEstado.value = 'pendiente_pago,reembolso_pendiente';
  if (selectPagoEstado) selectPagoEstado.value = '';

  adminReservasBusqueda = '';
  adminReservasEstado = 'pendiente_pago,reembolso_pendiente';
  adminReservasPagoEstado = '';
  adminReservasPage = 1;

  cargarReservasAdmin();
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

    const estadosProcesados = [
      'confirmada',
      'rechazada',
      'cancelada',
      'expirada',
      'reembolsada'
    ].join(',');

    const params = new URLSearchParams({
      estado: estadosProcesados,
      page: 1,
      limit: 100
    });

    if (adminReportesFechaDesde) {
      params.set('fechaDesde', adminReportesFechaDesde);
    }

    if (adminReportesFechaHasta) {
      params.set('fechaHasta', adminReportesFechaHasta);
    }

    const res = await fetch(`${API_URL}/admin/reservas?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No se pudieron exportar las reservas.');
      return;
    }

    const reservas = Array.isArray(data.reservas) ? data.reservas : [];

    if (reservas.length === 0) {
      mostrarAlerta('No hay reservas procesadas para exportar.');
      return;
    }

    const formatearFecha = (fecha) => {
      if (!fecha) return 'No disponible';
      return new Date(fecha).toLocaleDateString('es-CL');
    };

    const filas = reservas.map((r) => ({
      CodigoReserva: r.codigoReserva || `TG-${String(r._id || '').slice(-6).toUpperCase()}`,
      Servicio: r.servicio || r.servicioId?.nombre || 'No disponible',
      Cliente: r.nombreCliente || r.usuarioId?.username || 'No disponible',
      Email: r.emailCliente || r.usuarioId?.email || 'No disponible',
      Telefono: r.telefonoCliente || 'No disponible',
      FechaInicio: formatearFecha(r.fechaInicio),
      FechaFin: formatearFecha(r.fechaFin),
      Personas: r.personas || 'No informado',
      EstadoReserva: r.estado || 'pendiente',
      EstadoPago: r.pagoEstado || 'pendiente',
      MontoPagado: Number(r.montoPagado || 0),
      ComisionTurismoGO: Number(r.comisionTurismoGO || 0),
      MontoPropietario: Number(r.montoPropietario || 0),
      VoucherEnviado: r.voucherEnviado ? 'Sí' : 'No',
      FechaCreacion: formatearFecha(r.createdAt)
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
    link.download = `reporte-reservas-turismogo-${new Date().toISOString().slice(0, 10)}.csv`;
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

    const estadosProcesados = [
      'confirmada',
      'rechazada',
      'cancelada',
      'expirada',
      'reembolsada'
    ].join(',');

    const params = new URLSearchParams({
      estado: estadosProcesados,
      page: 1,
      limit: 100
    });

    if (adminReportesFechaDesde) {
      params.set('fechaDesde', adminReportesFechaDesde);
    }

    if (adminReportesFechaHasta) {
      params.set('fechaHasta', adminReportesFechaHasta);
    }

    const res = await fetch(`${API_URL}/admin/reservas?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No se pudieron exportar las reservas.');
      return;
    }

    const reservas = Array.isArray(data.reservas) ? data.reservas : [];

    if (reservas.length === 0) {
      mostrarAlerta('No hay reservas procesadas para exportar.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const formatearMonto = (valor) => {
      return `$${Number(valor || 0).toLocaleString('es-CL')}`;
    };

    const formatearFecha = (fecha) => {
      if (!fecha) return 'No disponible';
      return new Date(fecha).toLocaleDateString('es-CL');
    };

    const totalVentas = reservas.reduce((acc, r) => acc + (Number(r.montoPagado) || 0), 0);
    const totalComision = reservas.reduce((acc, r) => acc + (Number(r.comisionTurismoGO) || 0), 0);
    const totalPropietarios = reservas.reduce((acc, r) => acc + (Number(r.montoPropietario) || 0), 0);

    doc.setFontSize(18);
    doc.text('TurismoGO - Reporte de Reservas Procesadas', 14, 20);

    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}`, 14, 28);

    if (adminReportesFechaDesde || adminReportesFechaHasta) {
      doc.text(
        `Periodo: ${adminReportesFechaDesde || 'Inicio'} al ${adminReportesFechaHasta || 'Actual'}`,
        14,
        35
      );
    }

    doc.setFontSize(11);
    doc.text(`Total ventas: ${formatearMonto(totalVentas)}`, 14, 45);
    doc.text(`Comisión TurismoGO: ${formatearMonto(totalComision)}`, 14, 52);
    doc.text(`Monto propietarios: ${formatearMonto(totalPropietarios)}`, 14, 59);

    let y = 72;

    reservas.forEach((r, index) => {
      const codigoReserva = r.codigoReserva || `TG-${String(r._id || '').slice(-6).toUpperCase()}`;
      const cliente = r.nombreCliente || r.usuarioId?.username || 'No disponible';
      const servicio = r.servicio || r.servicioId?.nombre || 'No disponible';
      const estado = r.estado || 'pendiente';
      const pago = r.pagoEstado || 'pendiente';
      const monto = Number(r.montoPagado || 0);
      const comision = Number(r.comisionTurismoGO || 0);
      const propietario = Number(r.montoPropietario || 0);

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text(`${index + 1}. ${codigoReserva} - ${servicio}`, 14, y);

      doc.setFontSize(9);
      doc.text(`Cliente: ${cliente}`, 14, y + 7);
      doc.text(`Email: ${r.emailCliente || 'No disponible'}`, 14, y + 13);
      doc.text(`Estado: ${estado} | Pago: ${pago}`, 14, y + 19);
      doc.text(`Fechas: ${formatearFecha(r.fechaInicio)} al ${formatearFecha(r.fechaFin)}`, 14, y + 25);
      doc.text(`Monto: ${formatearMonto(monto)} | Comisión: ${formatearMonto(comision)} | Propietario: ${formatearMonto(propietario)}`, 14, y + 31);
      doc.text(`Voucher enviado: ${r.voucherEnviado ? 'Sí' : 'No'}`, 14, y + 37);

      y += 48;
    });

    doc.save(`reporte-reservas-turismogo-${new Date().toISOString().slice(0, 10)}.pdf`);

  } catch (error) {
    console.error('Error exportando PDF:', error);
    mostrarAlerta('Error al exportar PDF.');
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
    cargarStatsReservasAdmin();
    cargarReportesReservasAdmin();

  } catch (error) {
    console.error('Error eliminando usuario:', error);
   mostrarAlerta('Error al eliminar usuario');
  }
}
window.cambiarPaginaReservasAdmin = cambiarPaginaReservasAdmin;
window.aplicarFiltrosReservasBackendAdmin = aplicarFiltrosReservasBackendAdmin;
window.limpiarFiltrosReservasBackendAdmin = limpiarFiltrosReservasBackendAdmin;
window.aplicarPeriodoReportesAdmin = aplicarPeriodoReportesAdmin;
window.aplicarRangoReportesAdmin = aplicarRangoReportesAdmin;
window.limpiarFiltrosReportesAdmin = limpiarFiltrosReportesAdmin;