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
    const confirmar = confirm('¿Seguro que deseas cancelar esta reserva?');

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/reservas/${reservaId}/cancelar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo cancelar la reserva');
      return;
    }

    alert(data.message || 'Reserva cancelada correctamente');

    cargarReservas();
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    alert('Error al cancelar reserva');
  }
}
async function cargarServicios() {
  try {
    const cont = document.getElementById('servicios');
    if (!cont) return;

    const res = await fetch(`${API_URL}/servicios`);
    const servicios = await res.json();
    document.getElementById('stat-servicios').textContent = servicios.length;

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
          <img src="${img}" alt="${s.nombre}">
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
function mostrarPanelPropietario() {
  const role = localStorage.getItem('role');
  const panel = document.getElementById('panel-propietario');

  if (!panel) return;

  if (role === 'propietario' || role === 'admin') {
  panel.style.display = 'block';
  cargarMisServicios();
  cargarReservasPropietario();
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
      alert('Debes iniciar sesión');
      window.location.href = 'index.html';
      return;
    }

    if (!nombre || !descripcion || !precio || !imagenFiles || imagenFiles.length === 0) {
      alert('Todos los campos son obligatorios');
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
        'Authorization': token
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo crear el servicio');
      return;
    }

    alert(data.message || 'Servicio creado correctamente');

    document.getElementById('nuevo-nombre').value = '';
    document.getElementById('nuevo-descripcion').value = '';
    document.getElementById('nuevo-precio').value = '';
    document.getElementById('nuevo-imagen').value = '';

    cargarServicios();
  } catch (error) {
    console.error('Error al crear servicio:', error);
    alert('Error al crear servicio');
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
        'Authorization': token
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
            <img src="${img}" alt="${s.nombre}">
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
          <button onclick='mostrarFormularioEditar(
            ${JSON.stringify(s._id)},
            ${JSON.stringify(s.nombre)},
            ${JSON.stringify(s.descripcion)},
            ${JSON.stringify(s.precio)}
          )'>
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
async function eliminarServicio(id) {
  try {
    const confirmar = confirm('¿Seguro que deseas eliminar este servicio?');

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/servicios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token
      }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo eliminar el servicio');
      return;
    }

    alert(data.message || 'Servicio eliminado correctamente');

    cargarServicios();
    cargarMisServicios();
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    alert('Error al eliminar servicio');
  }
}
function mostrarFormularioEditar(id, nombre, descripcion, precio) {
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

  const agregarImagenes = confirm('¿Deseas agregar nuevas imágenes a este servicio?');

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
        'Authorization': token
      },
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo editar el servicio');
      return;
    }

    alert(data.message || 'Servicio actualizado');

    cargarServicios();
    cargarMisServicios();
  } catch (error) {
    console.error('Error al editar servicio:', error);
    alert('Error al editar servicio');
  }
}
async function eliminarImagenServicio(servicioId, imagenUrl) {
  try {
    const confirmar = confirm('¿Eliminar esta imagen?');
    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/servicios/${servicioId}/imagenes`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ imagenUrl })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo eliminar la imagen');
      return;
    }

    alert(data.message || 'Imagen eliminada correctamente');

    cargarServicios();
    cargarMisServicios();
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    alert('Error al eliminar imagen');
  }
}
async function cargarReservasPropietario() {
  try {
    const cont = document.getElementById('reservas-propietario');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/reservas-propietario`, {
      headers: {
        'Authorization': token
      }
    });

    const reservas = await res.json();
    const pendientes = reservas.filter(r => r.estado === 'pendiente').length;
const confirmadas = reservas.filter(r => r.estado === 'confirmada').length;

let ingresos = 0;

reservas.forEach(r => {
  if (r.estado === 'confirmada' && r.servicioId?.precio) {
    ingresos += Number(r.servicioId.precio);
  }
});

document.getElementById('stat-pendientes').textContent = pendientes;
document.getElementById('stat-confirmadas').textContent = confirmadas;
document.getElementById('stat-ingresos').textContent =
  `$${ingresos.toLocaleString('es-CL')}`;

    if (!res.ok) {
      cont.innerHTML = `<p>${reservas.error || 'No se pudieron cargar las reservas.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    if (!reservas.length) {
      cont.innerHTML = '<p>No tienes reservas recibidas.</p>';
      return;
    }

    reservas.forEach((r) => {
      cont.innerHTML += `
        <div class="card">
          <h3>${r.servicio}</h3>
          <p><b>Cliente:</b> ${r.usuarioId?.username || 'No disponible'}</p>
          <p><b>Fecha inicio:</b> ${r.fechaInicio}</p>
          <p><b>Fecha fin:</b> ${r.fechaFin}</p>
          <p><b>Estado:</b> ${r.estado}</p>

          <button onclick="cambiarEstadoReserva('${r._id}', 'confirmada')">
            Confirmar
          </button>

          <button onclick="cambiarEstadoReserva('${r._id}', 'rechazada')">
            Rechazar
          </button>
        </div>
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
        'Authorization': token
      },
      body: JSON.stringify({ estado })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo actualizar la reserva');
      return;
    }

    alert(data.message || 'Reserva actualizada');

    cargarReservasPropietario();
  } catch (error) {
    console.error('Error al cambiar estado de reserva:', error);
    alert('Error al actualizar reserva');
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
        'Authorization': token
      }
    });

    const usuarios = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${usuarios.error || 'No se pudieron cargar usuarios.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    usuarios.forEach((u) => {
  cont.innerHTML += `
    <div class="card">
      <p><b>Usuario:</b> ${u.username}</p>
      <p><b>Rol actual:</b> ${u.role}</p>
      <p><b>Suscripción:</b> ${u.suscripcionActiva ? 'Activa' : 'Inactiva'}</p>
      <p><b>Plan:</b> ${u.plan || 'ninguno'}</p>

      <button onclick="cambiarRolUsuario('${u._id}', 'usuario')">
        Hacer usuario
      </button>

      <button onclick="cambiarRolUsuario('${u._id}', 'propietario')">
        Hacer propietario
      </button>

      <button onclick="cambiarRolUsuario('${u._id}', 'admin')">
        Hacer admin
      </button>
      <button onclick="actualizarSuscripcionUsuario('${u._id}', true, 'basico')">
      Activar básico
      </button>

      <button onclick="actualizarSuscripcionUsuario('${u._id}', true, 'pro')">
      Activar pro
      </button>

      <button onclick="actualizarSuscripcionUsuario('${u._id}', true, 'premium')">
      Activar premium
      </button>

      <button onclick="actualizarSuscripcionUsuario('${u._id}', false, 'ninguno')">
      Desactivar suscripción
      </button>
    </div>
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
        'Authorization': token
      }
    });

    const servicios = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${servicios.error || 'No se pudieron cargar servicios.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    servicios.forEach((s) => {
      cont.innerHTML += `
        <div class="card">
          <p><b>Servicio:</b> ${s.nombre}</p>
          <p><b>Precio:</b> $${s.precio}</p>
          <p><b>Propietario:</b> ${s.propietarioId?.username || 'Sin propietario'}</p>
        </div>
      `;
    });

  } catch (error) {
    console.error('Error admin servicios:', error);
  }
}
async function cargarReservasAdmin() {
  try {
    const cont = document.getElementById('admin-reservas');
    if (!cont) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/admin/reservas`, {
      headers: {
        'Authorization': token
      }
    });

    const reservas = await res.json();

    if (!res.ok) {
      cont.innerHTML = `<p>${reservas.error || 'No se pudieron cargar reservas.'}</p>`;
      return;
    }

    cont.innerHTML = '';

    reservas.forEach((r) => {
      cont.innerHTML += `
        <div class="card">
          <p><b>Cliente:</b> ${r.usuarioId?.username || 'No disponible'}</p>
          <p><b>Servicio:</b> ${r.servicio}</p>
          <p><b>Estado:</b> ${r.estado}</p>
        </div>
      `;
    });

  } catch (error) {
    console.error('Error admin reservas:', error);
  }
}
async function cambiarRolUsuario(usuarioId, nuevoRole) {
  try {
    const confirmar = confirm(`¿Seguro que deseas cambiar este usuario a ${nuevoRole}?`);

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ role: nuevoRole })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo cambiar el rol');
      return;
    }

    alert(data.message || 'Rol actualizado correctamente');

    cargarUsuariosAdmin();
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    alert('Error al cambiar rol');
  }
}
async function actualizarSuscripcionUsuario(usuarioId, suscripcionActiva, plan) {
  try {
    const confirmar = confirm(`¿Actualizar suscripción a ${plan}?`);

    if (!confirmar) return;

    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/admin/usuarios/${usuarioId}/suscripcion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        suscripcionActiva,
        plan
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo actualizar la suscripción');
      return;
    }

    alert(data.message || 'Suscripción actualizada correctamente');

    cargarUsuariosAdmin();
  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    alert('Error al actualizar suscripción');
  }
}