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
                <img src="${img}" alt="${servicio.nombre}">
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
    alert('No se encontró el servicio a editar.');
    return;
  }

  if (!nombre || !descripcion || !precio) {
    alert('Nombre, descripción y precio son obligatorios.');
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
      'Authorization': token
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

reservas.forEach((r) => {

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

  cont.innerHTML += `
    <div class="reservation-card">

      <div class="reservation-top">
        <div>
          <h3>${r.servicio}</h3>
          <p>Reserva recibida desde TurismoGO</p>
        </div>

        <span class="status-badge status-${r.estado}">
          ${r.estado}
        </span>
      </div>

      <p><strong>Cliente:</strong> ${nombreCliente}</p>
      <p><strong>Correo:</strong> ${emailCliente}</p>
      <p><strong>Teléfono:</strong> ${telefonoCliente}</p>
      <p><strong>Personas:</strong> ${personasReserva}</p>
      <p><strong>Mensaje:</strong> ${mensajeCliente}</p>

      <div class="reservation-dates">
        <div>
          <span>Fecha inicio</span>
          <strong>${r.fechaInicio}</strong>
        </div>

        <div>
          <span>Fecha fin</span>
          <strong>${r.fechaFin}</strong>
        </div>
      </div>

      <button onclick="cambiarEstadoReserva('${r._id}', 'confirmada')">
        Confirmar reserva
      </button>

      <button
        class="cancel-btn"
        onclick="cambiarEstadoReserva('${r._id}', 'rechazada')"
      >
        Rechazar reserva
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
  const imagenes = s.imagenes && s.imagenes.length ? s.imagenes : [s.imagen];

  cont.innerHTML += `
    <article class="admin-service-card">
      <div class="admin-service-gallery">
        ${imagenes.map(img => `
          <img src="${img}" alt="${s.nombre}">
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
        Authorization: token
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
async function exportarReservasAdmin() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    const res = await fetch(`${API_URL}/admin/reservas`, {
      headers: {
        Authorization: token
      }
    });

    const reservas = await res.json();

    if (!res.ok) {
      alert(reservas.error || 'No se pudieron exportar las reservas.');
      return;
    }

    if (!Array.isArray(reservas) || reservas.length === 0) {
      alert('No hay reservas para exportar.');
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
    alert('Error al exportar reservas.');
  }
}
async function exportarReservasPDFAdmin() {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    const res = await fetch(`${API_URL}/admin/reservas`, {
      headers: {
        Authorization: token
      }
    });

    const reservas = await res.json();

    if (!res.ok) {
      alert(reservas.error || 'No se pudieron exportar las reservas.');
      return;
    }

    if (!Array.isArray(reservas) || reservas.length === 0) {
      alert('No hay reservas para exportar.');
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
    alert('Error al exportar PDF.');
  }
}
async function simularPagoPlan(plan) {
  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/webpay/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ plan })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo iniciar el pago');
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
    alert('Error iniciando pago');
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
      ? servicio.imagenes
      : [servicio.imagen];

    document.getElementById('detalle-nombre').textContent = servicio.nombre;
    document.getElementById('detalle-subtitulo').textContent = servicio.nombre;
    document.getElementById('detalle-descripcion').textContent = servicio.descripcion;
    document.getElementById('detalle-precio').textContent =
      `$${Number(servicio.precio).toLocaleString('es-CL')}`;

    const propietario = servicio.propietarioId?.username || 'Anfitrión TurismoGO';

    document.getElementById('detalle-propietario').textContent =
      `Anfitrión: ${propietario}`;

    document.getElementById('owner-avatar').textContent =
      propietario.charAt(0).toUpperCase();

    contGaleria.innerHTML = `
      <img class="main-img" src="${imagenes[0]}" alt="${servicio.nombre}">

      <div class="gallery-small">
        ${(imagenes.slice(1, 5).map(img => `
          <img class="small-img" src="${img}" alt="${servicio.nombre}">
        `).join(''))}
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
      alert('Debe completar nombre, correo electrónico y fechas de reserva.');
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
      alert(data.error || 'No fue posible iniciar el proceso de pago.');
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
    alert('Ocurrió un error al iniciar el pago.');
  }
}
async function cargarServiciosPublicos() {
  try {
    const cont = document.getElementById('servicios-publicos');
    if (!cont) return;

    const res = await fetch(`${API_URL}/servicios`);
    const servicios = await res.json();

    console.log('Servicios públicos:', servicios);

    if (!res.ok || !Array.isArray(servicios)) {
      cont.innerHTML = `<p>Error al cargar servicios.</p>`;
      return;
    }

    cont.innerHTML = '';

    servicios.forEach((s) => {
      const imagenPrincipal =
        s.imagenes && s.imagenes.length && s.imagenes[0]
          ? s.imagenes[0]
          : s.imagen || 'https://placehold.co/400x300?text=TurismoGO';

      cont.innerHTML += `
        <article class="public-service-card">
          <img src="${imagenPrincipal}" alt="${s.nombre}">

          <div class="public-service-content">
            <h3>${s.nombre}</h3>
            <p>${s.descripcion}</p>

            <p class="public-price">
              $${Number(s.precio).toLocaleString('es-CL')}
            </p>

            <button onclick="window.location.href='servicio.html?id=${s._id}'">
              Ver aviso
            </button>
          </div>
        </article>
      `;
    });

  } catch (error) {
    console.error('Error al cargar servicios públicos:', error);
  }
}
function mostrarRegistroPropietario() {
  const modal = document.getElementById('registro-propietario');
  if (!modal) return;

  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}
async function registrarPropietarioConPago() {
  try {
    const nombreCompleto = document.getElementById('reg-nombre').value.trim();
    const telefono = document.getElementById('reg-telefono').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const username = document.getElementById('reg-usuario').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const plan = document.getElementById('reg-plan').value;

    if (!nombreCompleto || !telefono || !email || !username || !password || !plan) {
      alert('Debe completar todos los campos para registrar la cuenta de propietario.');
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
      alert(dataRegistro.error || 'No fue posible registrar la cuenta.');
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
      alert('Cuenta creada, pero no fue posible iniciar sesión automáticamente.');
      return;
    }

    localStorage.setItem('token', dataLogin.token);

    const payload = JSON.parse(atob(dataLogin.token.split('.')[1]));
    localStorage.setItem('role', payload.role);

    const resPago = await fetch(`${API_URL}/webpay/crear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': dataLogin.token
      },
      body: JSON.stringify({ plan })
    });

    const dataPago = await resPago.json();

    if (!resPago.ok) {
      alert(dataPago.error || 'Cuenta creada, pero no fue posible iniciar el pago.');
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = dataPago.url;

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = dataPago.token;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();

  } catch (error) {
    console.error('Error en registro de propietario:', error);
    alert('Ocurrió un error al registrar la cuenta de propietario.');
  }
}
async function actualizarEstadoReservaAdmin(idReserva, nuevoEstado) {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Sesión expirada. Inicia sesión nuevamente.');
      return;
    }

    const confirmar = confirm(`¿Deseas cambiar esta reserva a "${nuevoEstado}"?`);

    if (!confirmar) return;

    const res = await fetch(`${API_URL}/reservas/${idReserva}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token
      },
      body: JSON.stringify({
        estado: nuevoEstado
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'No se pudo actualizar la reserva.');
      return;
    }

    alert('Reserva actualizada correctamente.');
    cargarReservasAdmin();

  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    alert('Error al actualizar la reserva.');
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