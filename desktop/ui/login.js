// Pantalla de acceso: SOLO el login. El panel vive en home.html y el
// proceso principal cambia de pantalla recien cuando el acceso es valido.
'use strict';
const $ = (id) => document.getElementById(id);

async function onLoginSubmit(event) {
  event.preventDefault();
  const btn = $('login-btn');
  const error = $('login-error');
  error.hidden = true;
  btn.disabled = true;
  btn.innerHTML = 'Entrando…';
  try {
    const result = await window.api.login($('login-user').value.trim(), $('login-pass').value, $('login-remember').checked);
    if (result.ok) {
      $('login-pass').value = '';
      await window.api.entered();
    } else {
      error.textContent = (result.error || 'No se pudo entrar.') + (result.status ? ' (código ' + result.status + ')' : '');
      error.hidden = false;
    }
  } catch {
    error.textContent = 'Algo falló al entrar. Inténtalo de nuevo.';
    error.hidden = false;
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Sign In <span class="btn-arrow">→</span>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  $('login-form').addEventListener('submit', onLoginSubmit);
  $('forgot-link').addEventListener('click', () => { window.api.openRecovery(); });
  $('toggle-pass').addEventListener('click', () => {
    const input = $('login-pass');
    const btn = $('toggle-pass');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.querySelector('.eye-slash').hidden = !show;
    btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    input.focus();
  });
  // Si ya hay sesion guardada (Recuerdame), se entra directo al panel.
  const session = await window.api.session().catch(() => ({ loggedIn: false }));
  if (session && session.loggedIn) {
    await window.api.entered();
  }
});
