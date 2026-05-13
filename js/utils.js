function optimizarImagen(url) {
  if (!url || !url.includes('cloudinary')) return url;

  return url.replace(
    '/upload/',
    '/upload/f_auto,q_auto,w_800/'
  );
}

function mostrarAlerta(mensaje) {
  if (typeof customAlert === 'function') {
    customAlert(mensaje);
  } else {
    alert(mensaje);
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

function despertarBackend() {
  if (typeof API_URL === 'undefined') return;

  fetch(`${API_URL}/health`, {
    method: 'GET',
    cache: 'no-store'
  }).catch(() => {
    console.warn('Backend aún no responde al warm-up');
  });
}