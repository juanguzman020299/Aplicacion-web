const registroForm = document.querySelector('#registroForm');
const mensajeFormulario = document.querySelector('#mensajeFormulario');
const tablaUsuarios = document.querySelector('#tablaUsuarios tbody');
const totalUsuarios = document.querySelector('#totalUsuarios');
const ultimoRegistro = document.querySelector('#ultimoRegistro');
const limpiarTabla = document.querySelector('#limpiarTabla');
const cancelarEdicion = document.querySelector('#cancelarEdicion');
const botonGuardar = document.querySelector('#botonGuardar');
const tituloFormulario = document.querySelector('#tituloFormulario');
const passwordInput = document.querySelector('#password');
const ayudaPassword = document.querySelector('#ayudaPassword');

const API_URL = 'api/usuarios.php';
let usuarios = [];
let usuarioEditandoId = null;

function mostrarMensaje(texto, tipo = 'success') {
  mensajeFormulario.textContent = texto;
  mensajeFormulario.className = `form-message ${tipo}`;
  mensajeFormulario.hidden = false;
  setTimeout(() => {
    mensajeFormulario.hidden = true;
  }, 4500);
}

async function solicitarAPI(url, opciones = {}) {
  const respuesta = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  });

  let datos = {};
  try {
    datos = await respuesta.json();
  } catch (error) {
    throw new Error('El servidor devolvió una respuesta no válida.');
  }

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || 'Ocurrió un error en el servidor.');
  }

  return datos;
}

function actualizarResumen() {
  totalUsuarios.textContent = usuarios.length;
  ultimoRegistro.textContent = usuarios.length ? usuarios[0].nombre : 'Sin registros';
}

function crearCelda(texto) {
  const celda = document.createElement('td');
  celda.textContent = texto ?? '';
  return celda;
}

function renderizarUsuarios() {
  tablaUsuarios.replaceChildren();

  if (!usuarios.length) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 7;
    celda.className = 'empty-table';
    celda.textContent = 'Todavía no hay usuarios registrados en la base de datos.';
    fila.appendChild(celda);
    tablaUsuarios.appendChild(fila);
    actualizarResumen();
    return;
  }

  usuarios.forEach((usuario, index) => {
    const fila = document.createElement('tr');
    fila.appendChild(crearCelda(index + 1));
    fila.appendChild(crearCelda(usuario.nombre));
    fila.appendChild(crearCelda(usuario.correo));
    fila.appendChild(crearCelda(usuario.telefono));
    fila.appendChild(crearCelda(usuario.usuario));
    fila.appendChild(crearCelda(usuario.rol));

    const acciones = document.createElement('td');
    acciones.className = 'table-actions';

    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'small-button edit-button';
    editar.textContent = 'Editar';
    editar.addEventListener('click', () => iniciarEdicion(usuario));

    const eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.className = 'small-button danger-button';
    eliminar.textContent = 'Eliminar';
    eliminar.addEventListener('click', () => eliminarUsuario(usuario.id, usuario.nombre));

    acciones.append(editar, eliminar);
    fila.appendChild(acciones);
    tablaUsuarios.appendChild(fila);
  });

  actualizarResumen();
}

async function cargarUsuarios() {
  try {
    const datos = await solicitarAPI(API_URL);
    usuarios = datos.usuarios || [];
    renderizarUsuarios();
  } catch (error) {
    mostrarMensaje(`${error.message} Verifique que Apache esté iniciado y que el proyecto se abra desde localhost.`, 'error');
  }
}

function obtenerDatosFormulario() {
  const formData = new FormData(registroForm);
  return {
    nombre: formData.get('nombre').trim(),
    correo: formData.get('correo').trim(),
    telefono: formData.get('telefono').trim(),
    usuario: formData.get('usuario').trim(),
    password: formData.get('password'),
    rol: formData.get('rol'),
    comentario: formData.get('comentario').trim()
  };
}

function validarFormulario(datos) {
  if (!datos.nombre || !datos.correo || !datos.telefono || !datos.usuario || !datos.rol) {
    return 'Complete todos los campos requeridos.';
  }

  if (!usuarioEditandoId && !datos.password) {
    return 'La contraseña es obligatoria para crear el usuario.';
  }

  if (datos.password && datos.password.length < 6) {
    return 'La contraseña debe tener mínimo 6 caracteres.';
  }

  const telefonoDominicano = /^(809|829|849)-?\d{3}-?\d{4}$/;
  if (!telefonoDominicano.test(datos.telefono)) {
    return 'Ingrese un teléfono dominicano válido, por ejemplo 809-555-1234.';
  }

  return '';
}

function iniciarEdicion(usuario) {
  usuarioEditandoId = usuario.id;
  registroForm.nombre.value = usuario.nombre;
  registroForm.correo.value = usuario.correo;
  registroForm.telefono.value = usuario.telefono;
  registroForm.usuario.value = usuario.usuario;
  registroForm.rol.value = usuario.rol;
  registroForm.comentario.value = usuario.comentario || '';
  passwordInput.value = '';
  passwordInput.required = false;
  passwordInput.placeholder = 'Déjela vacía para conservarla';
  ayudaPassword.textContent = 'Opcional durante la edición.';
  botonGuardar.textContent = 'Guardar cambios';
  tituloFormulario.textContent = 'Editar usuario';
  cancelarEdicion.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function finalizarEdicion() {
  usuarioEditandoId = null;
  registroForm.reset();
  passwordInput.required = true;
  passwordInput.placeholder = 'Mínimo 6 caracteres';
  ayudaPassword.textContent = 'Obligatoria para crear un usuario.';
  botonGuardar.textContent = 'Registrar';
  tituloFormulario.textContent = 'Crear nuevo usuario';
  cancelarEdicion.hidden = true;
}

registroForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const datos = obtenerDatosFormulario();
  const error = validarFormulario(datos);

  if (error) {
    mostrarMensaje(error, 'error');
    return;
  }

  try {
    if (usuarioEditandoId) {
      await solicitarAPI(`${API_URL}?id=${usuarioEditandoId}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
      });
      mostrarMensaje('Usuario actualizado correctamente en la base de datos.');
    } else {
      await solicitarAPI(API_URL, {
        method: 'POST',
        body: JSON.stringify(datos)
      });
      mostrarMensaje('Usuario registrado correctamente en la base de datos.');
    }

    finalizarEdicion();
    await cargarUsuarios();
  } catch (errorServidor) {
    mostrarMensaje(errorServidor.message, 'error');
  }
});

async function eliminarUsuario(id, nombre) {
  if (!confirm(`¿Seguro que desea eliminar a ${nombre}?`)) return;

  try {
    await solicitarAPI(`${API_URL}?id=${id}`, { method: 'DELETE' });
    mostrarMensaje('Usuario eliminado correctamente.');
    if (usuarioEditandoId === id) finalizarEdicion();
    await cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
}

limpiarTabla.addEventListener('click', async () => {
  if (!usuarios.length) {
    mostrarMensaje('No hay usuarios para eliminar.', 'error');
    return;
  }

  if (!confirm('¿Seguro que desea eliminar todos los usuarios de la base de datos?')) return;

  try {
    await solicitarAPI(`${API_URL}?all=1`, { method: 'DELETE' });
    finalizarEdicion();
    mostrarMensaje('Todos los usuarios fueron eliminados correctamente.');
    await cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, 'error');
  }
});

cancelarEdicion.addEventListener('click', finalizarEdicion);
registroForm.addEventListener('reset', () => {
  if (usuarioEditandoId) setTimeout(finalizarEdicion, 0);
});

document.addEventListener('DOMContentLoaded', cargarUsuarios);
