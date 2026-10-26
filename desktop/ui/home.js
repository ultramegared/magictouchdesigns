// JQYDesigns Marketing — lógica de la interfaz local.
// Todo dato llega por window.api (preload): la interfaz no hace fetch ni
// conoce el token; eso vive en el proceso principal.
'use strict';

// Registro de versiones visible dentro del programa.
const CHANGELOG = [
  {
    version: '1.2.1',
    notes: 'Panel premium corporativo: botones laterales (una sección a la vez, sin lista infinita) y diseño ejecutivo azul marino, blanco y dorado, con rojo solo en indicadores.',
  },
  {
    version: '1.2.0',
    notes: 'Panel de Marketing COMPLETO como en la web: publicador central, Autopilot con controles y catálogo, historial de campañas, Google Analytics + Search Console + ventas, atribución, Google Ads, resultados, Instagram Insights, Learning, reporte diario y email.',
  },
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
  renderPublisherChannels(connections);
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
      social: def.key,
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

// ------------------------------------------------------------------ utilidades de panel
function fmtNum(n) { return Number(n || 0).toLocaleString('es'); }
function fmtMoney(n) { return '$' + Number(n || 0).toFixed(2); }

function statInto(box, num, lbl) {
  const wrap = document.createElement('div');
  wrap.className = 'ga-stat';
  const n = document.createElement('div');
  n.className = 'num';
  n.textContent = String(num);
  const l = document.createElement('div');
  l.className = 'lbl';
  l.textContent = lbl;
  wrap.appendChild(n);
  wrap.appendChild(l);
  box.appendChild(wrap);
}

function makeTable(cols, rows) {
  const table = document.createElement('table');
  table.className = 'tbl';
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  for (const col of cols) {
    const th = document.createElement('th');
    th.textContent = col.t;
    trh.appendChild(th);
  }
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const col of cols) {
      const td = document.createElement('td');
      td.textContent = String(col.f(row));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  return table;
}

function currentDays() {
  const sel = $('range-sel');
  return sel ? Number(sel.value || 30) : 30;
}

// ------------------------------------------------------------------ publicador
let publisherChannels = [];

function renderPublisherChannels(connections) {
  publisherChannels = (connections || []).filter((c) => c.connected && c.social);
  const box = $('pub-channels');
  if (!box) return;
  box.innerHTML = '';
  if (publisherChannels.length === 0) {
    box.textContent = 'Sin canales conectados para publicar.';
    return;
  }
  for (const conn of publisherChannels) {
    const label = document.createElement('label');
    label.className = 'chip';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = conn.social;
    input.checked = true;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + (conn.name || conn.social)));
    box.appendChild(label);
  }
}

async function onPublish() {
  const msg = $('pub-msg');
  const btn = $('pub-btn');
  const channels = Array.from(document.querySelectorAll('#pub-channels input:checked')).map((i) => i.value);
  const text = $('pub-text').value.trim();
  if (channels.length === 0) { msg.textContent = 'Elige al menos un canal.'; return; }
  if (!text) { msg.textContent = 'Escribe el texto de la publicación.'; return; }
  btn.disabled = true;
  msg.textContent = 'Publicando…';
  const body = {
    idempotencyKey: 'pc-' + Date.now(),
    campaignName: 'Central Publisher',
    channels,
    text,
    imageUrl: $('pub-image').value.trim() || undefined,
    videoUrl: $('pub-video').value.trim() || undefined,
    link: $('pub-link').value.trim() || undefined,
    whatsappTo: $('pub-whatsapp').value.trim() || undefined,
    youtubePrivacy: $('pub-privacy').value,
  };
  const result = await window.api.apiSend('POST', '/api/admin/marketing/social/publish', body);
  btn.disabled = false;
  if (!handleApiResult(result)) return;
  if (!result.ok) {
    msg.textContent = (result.data && (result.data.error || result.data.message)) || result.error || 'No se pudo publicar.';
    return;
  }
  const results = (result.data && result.data.results) || {};
  const parts = Object.keys(results).map((ch) => {
    const r = results[ch] || {};
    const ok = r.ok === true || r.success === true || r.published === true || r.status === 'PUBLISHED';
    return (ok ? '✓ ' : '✗ ') + ch + (r.error ? ': ' + r.error : '');
  });
  msg.textContent = parts.length ? parts.join(' · ') : 'Publicación enviada.';
  loadAutopilot();
  loadHistory();
}

// ------------------------------------------------------------------ catálogo / autopilot
async function loadCatalog() {
  const box = $('catalog-box');
  if (!box) return;
  const result = await window.api.apiGet('/api/admin/marketing/social/campaign/catalog');
  if (!handleApiResult(result)) return;
  const catalog = (result.data && result.data.catalog) || result.data || {};
  box.innerHTML = '';
  const stats = document.createElement('div');
  stats.className = 'ga-box';
  statInto(stats, catalog.enabled ? 'ON' : 'OFF', 'Catalog Autopilot');
  statInto(stats, catalog.pendingProducts ?? 0, 'Productos pendientes');
  statInto(stats, catalog.pendingPortfolio ?? 0, 'Portfolio pendiente');
  statInto(stats, catalog.lastProductName || '—', 'Último producto');
  box.appendChild(stats);
  const toggle = document.createElement('button');
  toggle.className = 'btn-gold btn-inline';
  toggle.textContent = catalog.enabled ? 'Pausar Content Autopilot' : 'Activar Content Autopilot';
  toggle.addEventListener('click', async () => {
    toggle.disabled = true;
    await window.api.apiSend('POST', '/api/admin/marketing/social/campaign/catalog', { enabled: !catalog.enabled });
    loadCatalog();
  });
  box.appendChild(toggle);
}

async function onAutopilotRun() {
  const msg = $('autopilot-run-msg');
  const btn = $('autopilot-run-btn');
  btn.disabled = true;
  msg.textContent = 'Ejecutando…';
  const result = await window.api.apiSend('POST', '/api/admin/marketing/social/campaign/autopilot-run-now', {});
  btn.disabled = false;
  if (!handleApiResult(result)) return;
  msg.textContent = result.ok ? 'Autopilot ejecutado. Actualizando actividad…' : ((result.data && (result.data.error || result.data.message)) || result.error || 'No se pudo ejecutar.');
  loadAutopilot();
  loadHistory();
}

// ------------------------------------------------------------------ historial
async function loadHistory() {
  const status = $('history-status');
  const list = $('history-list');
  if (!status || !list) return;
  status.textContent = 'Cargando historial…';
  list.innerHTML = '';
  const result = await window.api.apiGet('/api/admin/marketing/social/campaign/history');
  if (!handleApiResult(result)) return;
  if (!result.ok) { status.textContent = 'No se pudo cargar el historial.'; return; }
  const campaigns = asArray(result.data);
  if (campaigns.length === 0) { status.textContent = 'Sin campañas todavía.'; return; }
  status.textContent = campaigns.length + ' campaña(s)';
  for (const c of campaigns.slice(0, 20)) {
    const card = document.createElement('article');
    card.className = 'card';
    const title = document.createElement('strong');
    title.textContent = c.name || c.id || 'Campaña';
    card.appendChild(title);
    const meta = document.createElement('small');
    const chans = Array.isArray(c.channels) ? c.channels.length : 0;
    meta.textContent = (c.target_area || '') + ' · ' + formatWhen(c.created_at) + ' · ' + chans + ' canales' + (c.campaign_type ? ' · ' + c.campaign_type : '') + (c.autopilot_enabled ? ' · 🤖' : '');
    card.appendChild(meta);
    const row = document.createElement('div');
    row.className = 'row';
    const retry = document.createElement('button');
    retry.className = 'btn-ghost';
    retry.textContent = 'Reintentar';
    retry.addEventListener('click', async () => {
      retry.disabled = true;
      await window.api.apiSend('POST', '/api/admin/marketing/social/campaign/' + encodeURIComponent(c.id) + '/retry', {});
      loadHistory();
      loadAutopilot();
    });
    const del = document.createElement('button');
    del.className = 'btn-ghost';
    del.textContent = 'Borrar';
    del.addEventListener('click', async () => {
      if (!window.confirm('¿Borrar la campaña "' + (c.name || c.id) + '" del historial? No borra lo ya publicado en las redes.')) return;
      del.disabled = true;
      await window.api.apiSend('DELETE', '/api/admin/marketing/social/campaign/' + encodeURIComponent(c.id));
      loadHistory();
    });
    row.appendChild(retry);
    row.appendChild(del);
    card.appendChild(row);
    list.appendChild(card);
  }
}

// ------------------------------------------------------------------ analíticas (Google + ventas + atribución)
async function loadAnalytics() {
  const days = currentDays();
  const gaStatus = $('ga-status');
  const gaBox = $('ga-box');
  const gscStatus = $('gsc-status');
  const gscBox = $('gsc-box');
  const gscTable = $('gsc-table');
  gaStatus.textContent = 'Cargando analíticas…';
  gaBox.innerHTML = '';
  gscBox.innerHTML = '';
  gscTable.innerHTML = '';

  const [verify, report, realtime] = await Promise.all([
    window.api.apiGet('/api/admin/marketing/search-console/verify-all'),
    window.api.apiGet('/api/admin/marketing/search-console/google-analytics/report?days=' + days),
    window.api.apiGet('/api/admin/marketing/search-console/google-analytics/realtime'),
  ]);
  if (!handleApiResult(verify)) return;

  const gaInfo = (verify.data && verify.data.analytics) || {};
  gaStatus.textContent = gaInfo.connected
    ? 'Propiedad ' + (gaInfo.propertyId || '') + ' conectada' + (gaInfo.dataVerified ? ' · datos verificados' : '')
    : (gaInfo.error || 'GA4 sin verificar.');

  const stats = [];
  const summaryRows = report.data && report.data.summary && report.data.summary.rows;
  if (Array.isArray(summaryRows) && summaryRows[0] && Array.isArray(summaryRows[0].metricValues)) {
    const mv = summaryRows[0].metricValues.map((x) => Number(x.value || 0));
    stats.push({ num: fmtNum(mv[0]), lbl: 'Usuarios activos' });
    stats.push({ num: fmtNum(mv[1]), lbl: 'Sesiones' });
    stats.push({ num: fmtNum(mv[2]), lbl: 'Vistas' });
    stats.push({ num: fmtMoney(mv[3]), lbl: 'Ingresos GA' });
  }
  const activeUsers = pick(realtime.data, ['active_users', 'activeUsers', 'total', 'value'], null);
  if (activeUsers !== null && activeUsers !== '') stats.push({ num: activeUsers, lbl: 'Usuarios activos ahora' });
  const dailyRows = (report.data && report.data.daily && report.data.daily.rows) || (report.data && report.data.rows) || [];
  if (Array.isArray(dailyRows) && dailyRows.length) stats.push({ num: dailyRows.length, lbl: 'Filas del histórico' });
  if (stats.length === 0) gaStatus.textContent += ' Sin datos por ahora.';
  for (const s of stats) statInto(gaBox, s.num, s.lbl);

  // Search Console
  const gsc = await window.api.apiGet('/api/admin/marketing/search-console/analytics?days=' + days);
  if (handleApiResult(gsc) && gsc.ok) {
    const rows = (gsc.data && gsc.data.rows) || [];
    const totals = rows.reduce((acc, r) => ({
      clicks: acc.clicks + Number(r.clicks || 0),
      impressions: acc.impressions + Number(r.impressions || 0),
      position: acc.position + Number(r.position || 0) * Number(r.impressions || 0),
    }), { clicks: 0, impressions: 0, position: 0 });
    const gscInfo = (verify.data && verify.data.searchConsole) || {};
    gscStatus.textContent = (gscInfo.resolvedSiteUrl || gscInfo.siteUrl || (gsc.data && gsc.data.siteUrl) || 'Search Console') + ' · ' + ((gsc.data && gsc.data.startDate) || '') + ' a ' + ((gsc.data && gsc.data.endDate) || '');
    statInto(gscBox, fmtNum(totals.clicks), 'Clics');
    statInto(gscBox, fmtNum(totals.impressions), 'Impresiones');
    statInto(gscBox, totals.impressions ? (totals.clicks / totals.impressions * 100).toFixed(2) + '%' : '—', 'CTR');
    statInto(gscBox, totals.impressions ? (totals.position / totals.impressions).toFixed(1) : '—', 'Posición media');
  } else {
    gscStatus.textContent = 'Search Console no disponible por ahora.';
  }

  loadSales(days);
  loadAttribution(days);
}

async function loadSales(days) {
  const status = $('sales-status');
  const box = $('sales-box');
  if (!status || !box) return;
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const iso = (d) => d.toISOString().slice(0, 10);
  const result = await window.api.apiGet('/api/admin/sales?start=' + iso(start) + '&end=' + iso(end));
  if (!handleApiResult(result)) return;
  if (!result.ok) { status.textContent = 'Ventas no disponibles.'; return; }
  const daily = ((result.data && result.data.daily) || []).slice(-14);
  const totalOrders = pick(result.data, ['totalOrders', 'orders'], null);
  const totalRevenue = pick(result.data, ['totalRevenue', 'revenue'], null);
  const sumOrders = daily.reduce((s, r) => s + Number(r.orders || 0), 0);
  const sumRevenue = daily.reduce((s, r) => s + Number(r.revenue || 0), 0);
  status.textContent = (totalOrders !== null ? totalOrders : sumOrders) + ' órdenes · ' + fmtMoney(totalRevenue !== null ? totalRevenue : sumRevenue) + ' (últimos ' + days + ' días)';
  box.innerHTML = '';
  if (daily.length === 0) { box.textContent = 'Sin ventas registradas en el período.'; return; }
  const max = Math.max(...daily.map((r) => Number(r.revenue || 0)), 1);
  const chart = document.createElement('div');
  chart.className = 'sales-chart';
  for (const row of daily) {
    const col = document.createElement('div');
    col.className = 'chart-col';
    col.title = String(row.date || '') + ': ' + fmtMoney(row.revenue) + ' · ' + (row.orders || 0) + ' órdenes';
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = Math.max(4, (Number(row.revenue || 0) / max) * 100) + '%';
    const lab = document.createElement('span');
    lab.textContent = String(row.date || '').slice(5);
    col.appendChild(bar);
    col.appendChild(lab);
    chart.appendChild(col);
  }
  box.appendChild(chart);
}

async function loadAttribution(days) {
  const attrBox = $('attr-table');
  const adsBox = $('ads-box');
  const resBox = $('results-table');
  const campaigns = await window.api.apiGet('/api/admin/marketing/search-console/google-analytics/campaigns?days=' + days);
  if (handleApiResult(campaigns) && campaigns.ok) {
    const rows = ((campaigns.data && campaigns.data.rows) || []).map((row) => ({
      campaign: (row.dimensionValues && row.dimensionValues[0] && row.dimensionValues[0].value) || 'N/A',
      source: (row.dimensionValues && row.dimensionValues[1] && row.dimensionValues[1].value) || 'N/A',
      medium: (row.dimensionValues && row.dimensionValues[2] && row.dimensionValues[2].value) || 'N/A',
      sessions: fmtNum(row.metricValues && row.metricValues[0] && row.metricValues[0].value),
      conversions: fmtNum(row.metricValues && row.metricValues[2] && row.metricValues[2].value),
      revenue: fmtMoney(row.metricValues && row.metricValues[3] && row.metricValues[3].value),
    }));
    attrBox.innerHTML = '';
    attrBox.appendChild(rows.length ? makeTable([
      { t: 'Campaña', f: (r) => r.campaign }, { t: 'Fuente', f: (r) => r.source }, { t: 'Medio', f: (r) => r.medium },
      { t: 'Sesiones', f: (r) => r.sessions }, { t: 'Conversiones', f: (r) => r.conversions }, { t: 'Ingresos', f: (r) => r.revenue },
    ], rows.slice(0, 20)) : document.createTextNode('Sin datos de atribución en el período.'));
  }
  const ads = await window.api.apiGet('/api/admin/marketing/social/google-ads/verify');
  if (handleApiResult(ads) && ads.ok) {
    const d = ads.data || {};
    adsBox.textContent = (d.state || (d.connected ? 'Conectado' : 'Sin verificar')) + ' — ' + (d.message || d.error || '') + (Array.isArray(d.missing) && d.missing.length ? ' Faltan: ' + d.missing.join(', ') : '');
  } else {
    adsBox.textContent = 'Google Ads no disponible.';
  }
  loadResults(days);
}

async function loadResults(days) {
  const box = $('results-table');
  if (!box) return;
  const result = await window.api.apiGet('/api/admin/marketing/social/campaign/results?days=' + days);
  if (!handleApiResult(result)) return;
  const rows = (result.data && result.data.results) || asArray(result.data);
  box.innerHTML = '';
  box.appendChild(rows.length ? makeTable([
    { t: 'Campaña', f: (r) => r.campaignName || '—' }, { t: 'Estado', f: (r) => r.publicationStatus || '—' },
    { t: 'Publicadas', f: (r) => r.published ?? 0 }, { t: 'En proceso', f: (r) => r.processing ?? 0 }, { t: 'Fallidas', f: (r) => r.failed ?? 0 },
    { t: 'Sesiones', f: (r) => (r.metrics && r.metrics.sessions != null ? fmtNum(r.metrics.sessions) : 'N/A') },
    { t: 'Ingresos', f: (r) => (r.metrics && r.metrics.revenue != null ? fmtMoney(r.metrics.revenue) : 'N/A') },
  ], rows.slice(0, 20)) : document.createTextNode('Sin resultados de campañas todavía.'));
}

// ------------------------------------------------------------------ instagram / learning / daily / email
async function loadInstagram() {
  const status = $('ig-status');
  const box = $('ig-box');
  if (!status || !box) return;
  status.textContent = 'Consultando la API de Instagram…';
  box.innerHTML = '';
  const result = await window.api.apiGet('/api/admin/marketing/social/instagram/insights?days=' + currentDays());
  if (!handleApiResult(result)) return;
  if (!result.ok || !result.data) { status.textContent = 'Insights no disponibles.'; return; }
  const d = result.data;
  status.textContent = '@' + ((d.account && d.account.username) || (d.account && d.account.id) || '') + ' · ' + (d.periodDays || '') + ' días · ' + formatWhen(d.generatedAt);
  const stats = document.createElement('div');
  stats.className = 'ga-box';
  for (const metric of d.accountInsights || []) {
    const value = (metric.total_value && metric.total_value.value) ?? (Array.isArray(metric.values) ? metric.values.reduce((s, x) => s + Number(x.value || 0), 0) : undefined);
    statInto(stats, value === undefined ? '—' : fmtNum(value), metric.title || metric.name);
  }
  box.appendChild(stats);
  for (const media of (d.recentMedia || []).slice(0, 10)) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = (media.mediaType || '') + ' · ' + (media.timestamp ? new Date(media.timestamp).toLocaleDateString('es') : '') + ' · ' + (media.likeCount || 0) + ' likes · ' + (media.commentsCount || 0) + ' comentarios — ' + (media.caption || 'Sin caption');
    box.appendChild(p);
  }
}

async function loadLearning() {
  const status = $('learning-status');
  const box = $('learning-box');
  if (!status || !box) return;
  const result = await window.api.apiGet('/api/admin/marketing/social/campaign/learning');
  if (!handleApiResult(result)) return;
  const insights = (result.data && result.data.insights) || [];
  box.innerHTML = '';
  if (insights.length === 0) { status.textContent = 'Sin datos de aprendizaje todavía.'; return; }
  const stats = document.createElement('div');
  stats.className = 'ga-box';
  for (const item of insights) {
    statInto(stats, (Number(item.score || 0) * 100).toFixed(1), item.channel + ' · ' + (item.observations || 0) + ' obs' + (item.recommended ? ' · recomendado' : ''));
  }
  box.appendChild(stats);
  status.textContent = insights.some((i) => i.sessions > 0 || i.conversions > 0 || i.revenue > 0)
    ? 'Learning activo con evidencia de GA4.'
    : 'Sin evidencia de resultado atribuido todavía.';
}

async function loadDaily() {
  const status = $('daily-status');
  const box = $('daily-box');
  if (!status || !box) return;
  const result = await window.api.apiGet('/api/admin/marketing/social/campaign/daily-summary');
  if (!handleApiResult(result)) return;
  const s = result.data && result.data.summary;
  if (!s) { status.textContent = 'Sin reporte diario todavía.'; return; }
  status.textContent = 'Generado: ' + formatWhen(s.generatedAt);
  box.innerHTML = '';
  const stats = document.createElement('div');
  stats.className = 'ga-box';
  statInto(stats, s.last24.publications, 'Publicaciones 24h');
  statInto(stats, fmtNum(s.last24.sessions), 'Sesiones');
  statInto(stats, s.last24.conversions, 'Conversiones');
  statInto(stats, fmtMoney(s.last24.revenue), 'Ingresos atribuidos');
  statInto(stats, 'Nivel ' + s.learning.level, s.learning.levelName || '');
  box.appendChild(stats);
  for (const ch of s.channels || []) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = ch.channel + ' · ' + ch.successful + '/' + ch.publications + ' publicaciones OK · ' + ch.sessions + ' sesiones · ' + ch.conversions + ' conversiones · ' + fmtMoney(ch.revenue);
    box.appendChild(p);
  }
  const meta = document.createElement('p');
  meta.className = 'muted';
  meta.textContent = 'Meta siguiente: ' + (s.learning.nextTarget || '');
  box.appendChild(meta);
}

async function loadEmail() {
  const box = $('email-box');
  if (!box) return;
  const result = await window.api.apiGet('/api/admin/marketing/social/email/status');
  if (!handleApiResult(result)) return;
  const d = result.data || {};
  box.textContent = d.configured
    ? 'Configurado · envía desde ' + (d.fromEmail || '')
    : 'No configurado' + (d.fromEmail ? ' · ' + d.fromEmail : '');
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
  loadCatalog();
  loadHistory();
  loadAnalytics();
  loadInstagram();
  loadLearning();
  loadDaily();
  loadEmail();
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
  document.querySelectorAll('.sidenav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidenav button').forEach((b) => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.dataset.view === btn.dataset.target));
      window.scrollTo({ top: 0 });
    });
  });
  $('channels-refresh').addEventListener('click', loadChannels);
  $('pub-btn').addEventListener('click', onPublish);
  $('autopilot-run-btn').addEventListener('click', onAutopilotRun);
  $('history-refresh').addEventListener('click', loadHistory);
  $('ig-refresh').addEventListener('click', loadInstagram);
  $('daily-refresh').addEventListener('click', loadDaily);
  $('range-sel').addEventListener('change', () => { loadAnalytics(); loadInstagram(); });
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
