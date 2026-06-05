const registroForm = document.querySelector('#registroForm');
const mensajeFormulario = document.querySelector('#mensajeFormulario');
const tablaUsuarios = document.querySelector('#tablaUsuarios tbody');
const totalUsuarios = document.querySelector('#totalUsuarios');
const ultimoRegistro = document.querySelector('#ultimoRegistro');
const limpiarTabla = document.querySelector('#limpiarTabla');
const STORAGE_KEY = 'usuariosRegistradosGrupo9';
let usuarios = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function guardarUsuarios() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

function mostrarMensaje(texto, tipo = 'success') {
  mensajeFormulario.textContent = texto;
  mensajeFormulario.className = `form-message ${tipo}`;
  mensajeFormulario.hidden = false;
  setTimeout(() => { mensajeFormulario.hidden = true; }, 4500);
}

function actualizarResumen() {
  if (totalUsuarios) totalUsuarios.textContent = usuarios.length;
  if (ultimoRegistro) ultimoRegistro.textContent = usuarios.length ? usuarios[usuarios.length - 1].nombre : 'Sin registros';
}

function renderizarUsuarios() {
  if (!tablaUsuarios) return;
  tablaUsuarios.innerHTML = '';
  if (!usuarios.length) {
    tablaUsuarios.innerHTML = '<tr><td colspan="5" class="empty-table">Todavía no hay usuarios registrados.</td></tr>';
    actualizarResumen();
    return;
  }
  usuarios.forEach((usuario, index) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `<td>${index + 1}</td><td>${usuario.nombre}</td><td>${usuario.correo}</td><td>${usuario.telefono}</td><td>${usuario.rol}</td>`;
    tablaUsuarios.appendChild(fila);
  });
  actualizarResumen();
}

function validarFormulario(datos) {
  if (!datos.nombre || !datos.correo || !datos.telefono || !datos.usuario || !datos.password || !datos.rol) return 'Complete todos los campos requeridos antes de registrar.';
  if (datos.password.length < 6) return 'La contraseña debe tener mínimo 6 caracteres.';
  if (usuarios.some((u) => u.correo.toLowerCase() === datos.correo.toLowerCase())) return 'Ese correo ya fue registrado en esta sesión.';
  return '';
}

if (registroForm) {
  registroForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(registroForm);
    const nuevoUsuario = {
      nombre: formData.get('nombre').trim(), correo: formData.get('correo').trim(), telefono: formData.get('telefono').trim(),
      usuario: formData.get('usuario').trim(), password: formData.get('password'), rol: formData.get('rol'), comentario: formData.get('comentario').trim()
    };
    const error = validarFormulario(nuevoUsuario);
    if (error) { mostrarMensaje(error, 'error'); return; }
    usuarios.push(nuevoUsuario);
    guardarUsuarios();
    renderizarUsuarios();
    registroForm.reset();
    mostrarMensaje('Usuario registrado correctamente. Los datos se guardaron en el navegador.');
  });
}

if (limpiarTabla) {
  limpiarTabla.addEventListener('click', () => {
    usuarios = [];
    guardarUsuarios();
    renderizarUsuarios();
    mostrarMensaje('La tabla fue limpiada correctamente.');
  });
}

renderizarUsuarios();
