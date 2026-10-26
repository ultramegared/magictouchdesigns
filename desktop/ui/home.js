// JQYDesigns Marketing — lógica de la interfaz local.
// Todo dato llega por window.api (preload): la interfaz no hace fetch ni
// conoce el token; eso vive en el proceso principal.
'use strict';

// Registro de versiones visible dentro del programa.
const CHANGELOG = [
  {
    version: '1.1.5',
    notes: 'Pantallas separadas: el programa abre SOLO con el acceso y el panel carga al entrar (ya no se ve debajo del login). Canales lee el formato real del servidor: tus cuentas conectadas.',
  },
  {
    version: '1.1.4',
    notes: 'Fondo final con tu imagen del taller al anochecer y tu cartel dorado; la tarjeta de acceso con efecto 3D sobre la escena.',
  },
  {
    version: '1.1.3',
    notes: 'Look final estilo tu modelo: escena al anochecer en el jardín, tu logo real en la pared de piedra y la tarjeta de cristal a la derecha (Sign In, Remember me).',
  },
  {
    version: '1.1.2',
    notes: 'Fondo a pantalla completa: la sala premium con tus productos, con vida (zoom lento y luz).',
  },
  {
    version: '1.1.1',
    notes: 'Diseño corporativo premium: tu logo dorado 3D en el login y conexión reforzada (mismo motor de red que tu navegador).',
  },
  {
    version: '1.1.0',
    notes: 'Primera versión como software: inicio de sesión de administrador, panel de canales y Autopilot, actualización automática.',
  },
  {
    version: '1.0.0',
    notes: 'Instalador inicial: abría el panel de la página dentro de una ventana.',
  },
];

const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------ utilidades
function asArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  for (const key of ['connections', 'items', 'results', 'rows', 'data', 'publications', 'history']) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

function pick(obj, keys, fallback = '') {
  if (!obj) return fallback;
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return fallback;
}

function isConnected(conn) {
  const value = pick(conn, ['connected', 'is_connected', 'isConnected'], null);
  if (typeof value === 'boolean') return value;
  const status = String(pick(conn, ['status', 'state', 'connection_status'], '')).toLowerCase();
  return status === 'connected' || status === 'active' || status === 'ok';
}

function formatWhen(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es');
}

function handleApiResult(result) {
  if (result && result.sessionExpired) {
    window.api.goLogin();
    return false;
  }
  return true;
}

// ------------------------------------------------------------------ canales
async function loadChannels() {
  const status = $('channels-status');
  const grid = $('channels-grid');
  status.textContent = 'Cargando canales…';
  grid.innerHTML = '';
  const result = await window.api.apiGet('/api/admin/marketing/social');
  if (!handleApiResult(result)) return;
  if (!result.ok) {
    status.textContent = 'No se pudieron cargar los canales. Revisa tu conexión.';
    return;
  }
  const connections = parseConnections(result.data);
  if (connections.length === 0) {
    status.textContent = 'Todavía no hay canales conectados.';
    return;
  }
  status.textContent = '';
  for (const conn of connections) {
    grid.appendChild(channelCard(conn));
  }
}

// El servidor devuelve un objeto: { channels: {facebook: bool, ...},
// connected: { meta: {profile}, instagram: {profile}, ... } }.
// Se convierte a la lista de tarjetas del panel.
const CHANNEL_DEFS = [
  { key: 'facebook', label: 'Facebook', provider: 'meta' },
  { key: 'instagram', label: 'Instagram', provider: 'instagram' },
  { key: 'whatsapp', label: 'WhatsApp', provider: 'whatsapp' },
  { key: 'youtube', label: 'YouTube', provider: 'youtube' },
  { key: 'pinterest', label: 'Pinterest', provider: 'pinterest' },
  { key: 'tiktok', label: 'TikTok', provider: 'tiktok' },
];

function accountNameFor(key, profile) {
  if (!profile || typeof profile !== 'object') return '';
  if (key === 'facebook') {
    const pages = Array.isArray(profile.pages) ? profile.pages : [];
    return (pages[0] && (pages[0].name || pages[0].id)) || profile.name || '';
  }
  if (key === 'whatsapp') return profile.displayPhoneNumber || profile.phoneNumber || profile.name || '';
  return profile.username || profile.title || profile.display_name || profile.displayName || profile.name || '';
}

function parseConnections(data) {
  if (!data || typeof data !== 'object') return [];
  const channels = data.channels && typeof data.channels === 'object' ? data.channels : null;
  const connected = data.connected && typeof data.connected === 'object' ? data.connected : {};
  if (!channels) return asArray(data).map((c) => ({ ...c }));
  return CHANNEL_DEFS.map((def) => {
    const entry = connected[def.provider] || connected[def.key] || {};
    const profile = entry.profile || entry;
    return {
      provider: def.provider,
      name: def.label,
      account_name: accountNameFor(def.key, profile),
      connected: Boolean(channels[def.key]),
    };
  }).filter((c) => c.connected || connected[c.provider]);
}

function channelCard(conn) {
  const provider = String(pick(conn, ['provider', 'name', 'channel'], 'Canal'));
  const account = pick(conn, ['account_name', 'accountName', 'account', 'username', 'page_name', 'email'], '');
  const connected = isConnected(conn);

  const card = document.createElement('article');
  card.className = 'card';

  const title = document.createElement('h3');
  title.textContent = provider;
  card.appendChild(title);

  if (account) {
    const accountEl = document.createElement('p');
    accountEl.className = 'account';
    accountEl.textContent = account;
    card.appendChild(accountEl);
  }

  const state = document.createElement('div');
  state.className = `state ${connected ? 'ok' : 'bad'}`;
  state.textContent = connected ? '● Conectado' : '○ No conectado';
  card.appendChild(state);

  const result = document.createElement('p');
  result.className = 'verify-result';
  card.appendChild(result);

  const btn = document.createElement('button');
  btn.className = 'btn-gold btn-small';
  btn.textContent = 'Verificar';
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    result.textContent = 'Verificando en vivo…';
    const res = await window.api.apiGet(
      `/api/admin/marketing/social/${encodeURIComponent(provider)}/verify`
    );
    btn.disabled = false;
    if (!handleApiResult(res)) return;
    if (res.ok) {
      const detail = pick(res.data, ['message', 'status', 'account_name', 'account'], '');
      result.textContent = `Verificación en vivo: correcta${detail ? ` — ${detail}` : ''}.`;
    } else {
      const detail = pick(res.data, ['message', 'error'], '') || res.error || '';
      result.textContent = `Verificación en vivo: falló${detail ? ` — ${detail}` : ''}. Puede tocar reconectar el canal.`;
    }
  });
  card.appendChild(btn);
  return card;
}

// ------------------------------------------------------------------ autopilot
async function loadAutopilot() {
  const statusEl = $('autopilot-status');
  statusEl.textContent = 'Cargando estado…';
  const result = await window.api.apiGet('/api/admin/marketing/social/campaign/autopilot-status');
  if (!handleApiResult(result)) return;
  if (!result.ok) {
    statusEl.textContent = 'No se pudo cargar el estado del Autopilot.';
  } else {
    const data = result.data || {};
    const enabled = pick(data, ['enabled', 'active', 'is_active', 'running'], null);
    const lastRun = pick(data, ['last_run', 'lastRun', 'last_run_at', 'updated_at'], '');
    const summary = pick(data, ['message', 'status', 'summary'], '');
    const parts = [];
    if (typeof enabled === 'boolean') parts.push(enabled ? 'Autopilot activo.' : 'Autopilot apagado.');
    if (summary) parts.push(String(summary));
    if (lastRun) parts.push(`Última corrida: ${formatWhen(lastRun)}`);
    statusEl.textContent = parts.length ? parts.join(' ') : 'Autopilot sin datos por ahora.';
  }

  const pubStatus = $('publications-status');
  const list = $('publications-list');
  pubStatus.textContent = 'Cargando actividad…';
  list.innerHTML = '';
  const pubs = await window.api.apiGet('/api/admin/marketing/social/campaign/publications');
  if (!handleApiResult(pubs)) return;
  if (!pubs.ok) {
    pubStatus.textContent = 'No se pudo cargar la actividad reciente.';
    return;
  }
  const items = asArray(pubs.data).slice(0, 8);
  if (items.length === 0) {
    pubStatus.textContent = 'Sin actividad reciente.';
    return;
  }
  pubStatus.textContent = '';
  for (const item of items) {
    const li = document.createElement('li');
    const text = pick(item, ['message', 'caption', 'title', 'description', 'provider', 'status'], 'Publicación');
    const when = pick(item, ['created_at', 'published_at', 'date', 'timestamp'], '');
    li.textContent = String(text);
    if (when) {
      const whenEl = document.createElement('span');
      whenEl.className = 'when';
      whenEl.textContent = ` — ${formatWhen(when)}`;
      li.appendChild(whenEl);
    }
    list.appendChild(li);
  }
}

// ------------------------------------------------------------------ analíticas
async function loadAnalytics() {
  const statusEl = $('ga-status');
  const box = $('ga-box');
  statusEl.textContent = 'Cargando analíticas…';
  box.innerHTML = '';

  const realtime = await window.api.apiGet('/api/admin/marketing/search-console/google-analytics/realtime');
  if (!handleApiResult(realtime)) return;
  const report = await window.api.apiGet('/api/admin/marketing/search-console/google-analytics/report');
  if (!handleApiResult(report)) return;

  if (!realtime.ok && !report.ok) {
    statusEl.textContent = 'Analíticas no disponibles por ahora.';
    return;
  }
  statusEl.textContent = '';

  const stats = [];
  const activeUsers = pick(realtime.data, ['active_users', 'activeUsers', 'total', 'value'], null);
  if (activeUsers !== null && activeUsers !== '') {
    stats.push({ num: activeUsers, lbl: 'Usuarios activos ahora' });
  }
  const rows = report.data && (report.data.rows || asArray(report.data));
  if (Array.isArray(rows)) {
    stats.push({ num: rows.length, lbl: 'Filas del reporte histórico' });
  }
  if (stats.length === 0) {
    statusEl.textContent = 'Sin datos de analíticas por ahora.';
    return;
  }
  for (const stat of stats) {
    const wrap = document.createElement('div');
    wrap.className = 'ga-stat';
    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = String(stat.num);
    const lbl = document.createElement('div');
    lbl.className = 'lbl';
    lbl.textContent = stat.lbl;
    wrap.appendChild(num);
    wrap.appendChild(lbl);
    box.appendChild(wrap);
  }
}

// ------------------------------------------------------------------ versión / updates
function renderChangelog() {
  const list = $('changelog-list');
  list.innerHTML = '';
  for (const entry of CHANGELOG) {
    const li = document.createElement('li');
    const ver = document.createElement('span');
    ver.className = 'ver';
    ver.textContent = `v${entry.version}`;
    li.appendChild(ver);
    li.appendChild(document.createTextNode(entry.notes));
    list.appendChild(li);
  }
}

function setUpdatePill(text) {
  const pill = $('update-pill');
  if (!text) {
    pill.hidden = true;
    pill.textContent = '';
    return;
  }
  pill.hidden = false;
  pill.textContent = text;
}

function onUpdateStatus(payload) {
  if (!payload) return;
  const msg = $('update-msg');
  switch (payload.state) {
    case 'checking':
      setUpdatePill('Buscando actualización…');
      msg.textContent = 'Buscando actualizaciones…';
      break;
    case 'available':
      setUpdatePill(`Actualización v${payload.version || ''} disponible`);
      msg.textContent = `Hay una versión nueva (v${payload.version || ''}). Se está descargando sola.`;
      break;
    case 'downloading':
      setUpdatePill(`Descargando actualización… ${payload.percent || 0}%`);
      msg.textContent = `Descargando la actualización… ${payload.percent || 0}%`;
      break;
    case 'downloaded':
      setUpdatePill(`v${payload.version || ''} lista para instalar`);
      msg.textContent = `La versión v${payload.version || ''} ya se descargó. Reinicia el programa para terminar de actualizar.`;
      $('restart-update-btn').hidden = false;
      break;
    case 'none':
      setUpdatePill('');
      msg.textContent = 'Ya tienes la última versión.';
      break;
    case 'error':
      setUpdatePill('');
      msg.textContent = 'No se pudo buscar actualizaciones. Se intentará de nuevo al abrir el programa.';
      break;
    default:
      break;
  }
}

// ------------------------------------------------------------------ arranque
async function loadHome() {
  loadChannels();
  loadAutopilot();
  loadAnalytics();
}

document.addEventListener('DOMContentLoaded', async () => {
  // Sin sesion valida no hay panel: de vuelta a la pantalla de acceso.
  const session = await window.api.session().catch(() => ({ loggedIn: false }));
  if (!session || !session.loggedIn) {
    window.api.goLogin();
    return;
  }
  $('user-name').textContent = session.username || 'Administrador';
  $('logout-btn').addEventListener('click', async () => {
    await window.api.logout();
  });
  $('channels-refresh').addEventListener('click', loadChannels);
  $('check-updates-btn').addEventListener('click', async () => {
    const result = await window.api.checkUpdates();
    if (result && result.state === 'dev') {
      $('update-msg').textContent = 'Las actualizaciones automáticas funcionan en el programa ya instalado.';
    } else if (result && result.state === 'unavailable') {
      $('update-msg').textContent = 'La actualización automática no está disponible en esta copia.';
    } else if (result && result.state === 'error') {
      $('update-msg').textContent = 'No se pudo buscar actualizaciones ahora.';
    }
  });
  $('restart-update-btn').addEventListener('click', () => window.api.installUpdate());
  window.api.onUpdateStatus(onUpdateStatus);

  const version = await window.api.version().catch(() => '');
  if (version) {
    $('app-version').textContent = version;
    $('version-current').textContent = `v${version}`;
  }
  renderChangelog();
  loadHome();
});
