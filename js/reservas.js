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
    const cont =
  document.getElementById('reservas-cliente') ||
  document.getElementById('reservas');
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
  const pagoEstado = r.pagoEstado || 'pendiente';

  const servicio =
    r.servicio ||
    r.servicioId?.nombre ||
    'Servicio no disponible';

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

  cont.innerHTML += `
    <article class="client-reservation-card">
      <div class="client-reservation-top">
        <div>
          <span class="reservation-label">Reserva cliente</span>
          <h3>${servicio}</h3>
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

      <div class="client-reservation-info">
        <div>
          <span>Fecha inicio</span>
          <strong>${fechaInicio}</strong>
        </div>

        <div>
          <span>Fecha fin</span>
          <strong>${fechaFin}</strong>
        </div>

        <div>
          <span>Personas</span>
          <strong>${r.personas || 1}</strong>
        </div>

        <div>
          <span>Monto</span>
          <strong>$${monto.toLocaleString('es-CL')}</strong>
        </div>
      </div>

      <div class="client-actions">
        ${
          estado !== 'cancelada'
            ? `<button class="cancel-btn" onclick="cancelarReserva('${r._id}')">Cancelar reserva</button>`
            : '<p class="cancelled-text">Reserva cancelada</p>'
        }
      </div>
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

async function cargarReservasCliente() {
  await cargarReservas();

  const token = localStorage.getItem('token');

  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/reservas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const reservas = await res.json();

    if (!Array.isArray(reservas)) return;

    const total = reservas.length;
    const confirmadas = reservas.filter(r => (r.estado || '').toLowerCase() === 'confirmada').length;
    const pendientes = reservas.filter(r => (r.estado || '').toLowerCase() === 'pendiente').length;
    const pagos = reservas.filter(r => (r.pagoEstado || '').toLowerCase() === 'pagado').length;

    const statTotal = document.getElementById('client-stat-total');
    const statConfirmadas = document.getElementById('client-stat-confirmadas');
    const statPendientes = document.getElementById('client-stat-pendientes');
    const statPagos = document.getElementById('client-stat-pagos');

    if (statTotal) statTotal.textContent = total;
    if (statConfirmadas) statConfirmadas.textContent = confirmadas;
    if (statPendientes) statPendientes.textContent = pendientes;
    if (statPagos) statPagos.textContent = pagos;

  } catch (error) {
    console.error('Error cargando estadísticas cliente:', error);
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