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
        'Authorization': token
      }
    });

    const data = await res.json();

    if (!res.ok) {
      window.location.href = 'login.html';
      return;
    }

    if (data.username && perfil) {
      perfil.innerText = `Usuario: ${data.username}`;
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    window.location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
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
      alert('Debes iniciar sesión');
      window.location.href = 'login.html';
      return;
    }

    if (!fechaInicio || !fechaFin) {
      alert('Debes seleccionar fechas');
      return;
    }

    if (fechaFin < fechaInicio) {
      alert('La fecha final no puede ser menor a la fecha inicial');
      return;
    }

    const res = await fetch(`${API_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ servicio, fechaInicio, fechaFin })
    });

    const data = await res.json();
    alert(data.message || data.error || 'Respuesta desconocida');

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
        'Authorization': token
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
      cont.innerHTML += `
        <div class="card">
          <b>${r.servicio}</b><br>
          ${r.fechaInicio} - ${r.fechaFin}
        </div>
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

async function cargarServicios() {
  try {
    const cont = document.getElementById('servicios');
    if (!cont) return;

    const res = await fetch(`${API_URL}/servicios`);
    const servicios = await res.json();

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
      cont.innerHTML += `
        <div class="card">
          <img src="${s.imagen}" alt="${s.nombre}" style="width:100%; border-radius:10px;">
          <h3>${s.nombre}</h3>
          <p>${s.descripcion}</p>
          <p><b>$${s.precio}</b></p>
          <input type="date" id="inicio-${s._id}">
          <input type="date" id="fin-${s._id}">
          <button onclick="reservarServicio('${s.nombre}', '${s._id}')">Reservar</button>
        </div>
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
      alert('Debes iniciar sesión');
      window.location.href = 'login.html';
      return;
    }

    if (!fechaInicio || !fechaFin) {
      alert('Debes seleccionar fechas');
      return;
    }

    if (fechaFin < fechaInicio) {
      alert('La fecha final no puede ser menor a la fecha inicial');
      return;
    }

    const res = await fetch(`${API_URL}/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        servicio: nombre,
        fechaInicio,
        fechaFin
      })
    });

    const data = await res.json();
    alert(data.message || data.error || 'Respuesta desconocida');

    if (res.ok) {
      cargarReservas();
    }
  } catch (error) {
    console.error('Error al reservar servicio:', error);
  }
}

window.onload = () => {
  if (document.getElementById('servicios')) {
    cargarServicios();
  }

  if (document.getElementById('reservas')) {
    cargarReservas();
  }

  if (document.getElementById('perfil')) {
    cargarPerfil();
  }
};