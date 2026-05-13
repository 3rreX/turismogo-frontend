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