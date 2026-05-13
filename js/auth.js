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
      const tituloBienvenidaOwner = document.getElementById('titulo-bienvenida-owner');

      if (tituloBienvenidaOwner && role === 'propietario') {
        tituloBienvenidaOwner.textContent = `Hola, ${data.username}`;
      }

      if (role === 'admin') {
        perfil.innerHTML = `
          <div class="top-profile-mini">
            <span>${data.username}</span>
            <span>•</span>
            <span>Administrador</span>
          </div>
        `;
      } else {
        perfil.innerHTML = `
          <div class="top-profile-mini">
            <span>${data.username}</span>
            <span>•</span>
            <span>${data.plan ? data.plan : 'Sin plan'}</span>
            <span>•</span>
            ${
              data.suscripcionActiva
                ? '<span class="profile-active">Activo</span>'
                : '<span class="profile-pending">Pendiente</span>'
            }
          </div>
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
function mostrarRegistroCliente() {
  const modal = document.getElementById('registro-cliente');

  if (!modal) return;

  if (
    modal.style.display === 'none' ||
    modal.style.display === ''
  ) {
    modal.style.display = 'flex';
  } else {
    modal.style.display = 'none';
  }
}

async function registrarCliente() {
  try {

    const nombre = document.getElementById('cliente-nombre')?.value.trim();
    const email = document.getElementById('cliente-email')?.value.trim();
    const username = document.getElementById('cliente-usuario')?.value.trim();
    const password = document.getElementById('cliente-password')?.value.trim();

    const aceptaLegal =
      document.getElementById('aceptaLegalCliente')?.checked;

    if (!nombre || !email || !username || !password) {
      mostrarAlerta('Debes completar todos los campos.');
      return;
    }

    if (!aceptaLegal) {
      mostrarAlerta('Debes aceptar los términos y condiciones.');
      return;
    }

    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
        email,
        nombreCompleto: nombre
      })
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.error || 'No fue posible crear la cuenta.');
      return;
    }

    mostrarAlerta('Cuenta creada correctamente. Ahora puedes iniciar sesión con tu nombre de usuario.');

mostrarRegistroCliente();

const userInput = document.getElementById('user');
const passInput = document.getElementById('pass');

if (userInput) userInput.value = username;
if (passInput) passInput.value = '';

  } catch (error) {
    console.error('Error registrando cliente:', error);
    mostrarAlerta('Ocurrió un error al registrar la cuenta.');
  }
}