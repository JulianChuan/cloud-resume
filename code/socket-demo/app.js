/* ── Supply Chain Risk Report — app.js ── */

const API_BASE = 'https://api.socket.dev/v0';

/*
 * api.socket.dev does not send CORS headers, so the browser cannot call it
 * directly. All requests are routed through an AWS Lambda proxy that forwards
 * them to Socket (see aws/lambda/index.js).
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  AFTER you create the Lambda Function URL, paste it below.            │
 * │  It looks like:  https://abc123xyz.lambda-url.us-east-1.on.aws/       │
 * │  Keep the "?url=" on the end.                                         │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * If you ever run this somewhere Socket has enabled CORS, set
 * USE_PROXY = false to call the API directly.
 */
const USE_PROXY  = true;
const PROXY_BASE = 'https://picpw3cvvg3fa6sdchlcbncc6q0dvxdb.lambda-url.us-east-1.on.aws/?url=';

// Build the URL the browser should fetch — through the proxy, or direct.
function apiUrl(path) {
  const full = API_BASE + path;
  return USE_PROXY ? PROXY_BASE + encodeURIComponent(full) : full;
}

// ── DOM refs ──
const screenInput    = document.getElementById('screen-input');
const screenScanning = document.getElementById('screen-scanning');
const screenReport   = document.getElementById('screen-report');

const apiKeyInput  = document.getElementById('api-key');
const toggleKeyBtn = document.getElementById('toggle-key-visibility');
const jsonInput    = document.getElementById('json-input');
const fileInput    = document.getElementById('file-input');
const uploadZone   = document.getElementById('upload-zone');
const uploadFilename = document.getElementById('upload-filename');
const scanBtn      = document.getElementById('scan-btn');
const inputError   = document.getElementById('input-error');

const scanStatus   = document.getElementById('scan-status');
const scanDetail   = document.getElementById('scan-detail');
const progressBar  = document.getElementById('progress-bar');
const scanCount    = document.getElementById('scan-count');

const execHeadline  = document.getElementById('exec-headline');
const execBadge     = document.getElementById('exec-badge');
const execRiskLabel = document.getElementById('exec-risk-label');
const execBody      = document.getElementById('exec-body');
const execMeta      = document.getElementById('exec-meta');
const statsGrid     = document.getElementById('stats-grid');
const packageTable  = document.getElementById('package-table');
const newScanBtn    = document.getElementById('new-scan-btn');
const copyReportBtn = document.getElementById('copy-report-btn');

// ── State ──
let currentResults = [];

// ── Init ──
const savedKey = localStorage.getItem('socket_api_key');
if (savedKey) apiKeyInput.value = savedKey;

// ── Tab switching ──
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ── API key visibility toggle ──
toggleKeyBtn.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  document.getElementById('eye-icon').innerHTML = isPassword
    ? `<path d="M3 3l14 14M10.58 10.58A2.5 2.5 0 0012.5 10a2.5 2.5 0 00-2.5 2.5c0 .33.06.64.18.92M6.11 6.11A8 8 0 002 10s3.5 6 8 6a8 8 0 003.89-1.11M9.9 4.24A8 8 0 0118 10s-.5.83-1.38 1.76" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`
    : `<path d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>`;
});

// ── File upload ──
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  uploadFilename.textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => { jsonInput.value = e.target.result; };
  reader.readAsText(file);
});

['dragover', 'dragenter'].forEach(evt => {
  uploadZone.addEventListener(evt, e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
});
['dragleave', 'drop'].forEach(evt => {
  uploadZone.addEventListener(evt, e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    if (evt === 'drop') {
      const file = e.dataTransfer.files[0];
      if (file) {
        uploadFilename.textContent = file.name;
        const reader = new FileReader();
        reader.onload = ev => { jsonInput.value = ev.target.result; };
        reader.readAsText(file);
      }
    }
  });
});

// ── Error display ──
function showError(msg) {
  inputError.textContent = msg;
  inputError.classList.remove('hidden');
}
function clearError() {
  inputError.classList.add('hidden');
  inputError.textContent = '';
}

// ── Screen transitions ──
function showScreen(id) {
  [screenInput, screenScanning, screenReport].forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Scan button ──
scanBtn.addEventListener('click', startScan);

async function startScan() {
  clearError();

  if (USE_PROXY && PROXY_BASE.includes('PASTE_YOUR_LAMBDA')) {
    showError('Proxy not configured: paste your Lambda Function URL into PROXY_BASE in app.js.');
    return;
  }

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showError('Please enter your Socket API key. Get one free at socket.dev.');
    return;
  }

  const raw = jsonInput.value.trim();
  if (!raw) {
    showError('Please paste or upload a package.json file.');
    return;
  }

  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch {
    showError('That doesn\'t look like valid JSON. Please check your package.json and try again.');
    return;
  }

  let packages = extractPackages(pkg);

  // A full lockfile can list hundreds of packages; cap the batch so the
  // single proxied request stays within the Lambda's 30s timeout.
  if (packages.length > 200) packages = packages.slice(0, 200);

  if (packages.length === 0) {
    showError('No dependencies found. Paste a package.json with a "dependencies" block, or a package-lock.json.');
    return;
  }

  localStorage.setItem('socket_api_key', apiKey);

  showScreen('screen-scanning');
  try {
    currentResults = await scanPackages(packages, apiKey);
    buildReport(currentResults, packages.length);
    showScreen('screen-report');
  } catch (err) {
    console.error('Scan/report failed:', err);
    showScreen('screen-input');
    showError(scanErrorMessage(err));
    return;
  }
}

// Turn a thrown scan error into a friendly, specific message.
function scanErrorMessage(err) {
  switch (err && err.code) {
    case 'invalid_key':  return 'Your API key was rejected (401/403). Check the token at socket.dev and that it has organization access.';
    case 'no_org':       return 'No organization is associated with this API key. Create or join an org at socket.dev, then retry.';
    case 'org_failed':   return `Couldn't load your Socket organization (HTTP ${err.status || '?'}). Please try again.`;
    case 'batch_failed': return `Socket rejected the scan (HTTP ${err.status || '?'}).${err.detail ? ' ' + String(err.detail).slice(0, 200) : ''}`;
    default:             return `Something went wrong while building the report: ${(err && err.message) || 'unknown error'}. (Full details in the browser console.)`;
  }
}

// Pull a flat list of { name, version, rawVersion } from either a package.json
// or a package-lock.json (v1, v2, or v3). Deduplicates by package name.
function extractPackages(pkg) {
  const out = [];
  const seen = new Set();
  const add = (name, rawVersion) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    out.push({
      name,
      version: cleanVersion(rawVersion),
      rawVersion: (typeof rawVersion === 'string' ? rawVersion : (rawVersion && rawVersion.version)) || 'latest',
    });
  };

  // package-lock.json v2/v3: a "packages" map keyed by node_modules paths.
  if (pkg && pkg.packages && typeof pkg.packages === 'object') {
    for (const [path, meta] of Object.entries(pkg.packages)) {
      if (!path) continue; // "" is the root project itself
      const marker = 'node_modules/';
      const i = path.lastIndexOf(marker);
      const name = i >= 0 ? path.slice(i + marker.length) : path;
      add(name, meta && meta.version);
    }
    if (out.length) return out;
  }

  // package.json (string versions) OR package-lock.json v1 (object values).
  const deps = { ...(pkg && pkg.dependencies || {}), ...(pkg && pkg.devDependencies || {}) };
  for (const [name, val] of Object.entries(deps)) {
    add(name, typeof val === 'string' ? val : (val && val.version));
  }
  return out;
}

// Strip semver range operators to get a usable version string. Tolerates
// non-string inputs (e.g. a lockfile's object value) so it never throws.
function cleanVersion(range) {
  if (range && typeof range === 'object' && typeof range.version === 'string') range = range.version;
  if (typeof range !== 'string' || !range || range === '*' || range === 'latest') return 'latest';
  return range.replace(/^[\^~>=<]+/, '').split(' ')[0].split('||')[0].trim() || 'latest';
}

// ── API Calls ──
// Mirrors the real Socket product flow: resolve the org tied to the token,
// then submit every dependency in ONE batch call to the current (non-deprecated)
// /v0/orgs/{org_slug}/purl endpoint, which streams back package metadata + alerts.
async function scanPackages(packages, apiKey) {
  const authHeader = 'Basic ' + btoa(apiKey + ':');
  const total = packages.length;

  // 1) Resolve the organization slug associated with this API token.
  scanStatus.textContent = 'Connecting to Socket…';
  scanDetail.textContent = 'Resolving organization';
  progressBar.style.width = '15%';
  scanCount.textContent = '';

  const orgSlug = await getOrgSlug(authHeader);

  // 2) Submit all packages as PURLs in a single batch request.
  scanStatus.textContent = `Scanning ${total} package${total !== 1 ? 's' : ''}…`;
  scanDetail.textContent = 'Querying Socket package intelligence';
  progressBar.style.width = '45%';
  scanCount.textContent = `${total} package${total !== 1 ? 's' : ''} submitted`;

  const components = packages.map(p => ({ purl: toPurl(p.name, p.version) }));

  const res = await fetchWithRetry(
    apiUrl(`/orgs/${orgSlug}/purl?alerts=true`),
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/x-ndjson',
      },
      body: JSON.stringify({ components }),
    }
  );

  if (res.status === 401 || res.status === 403) throw withCode(new Error('auth'), 'invalid_key');
  if (!res.ok) {
    const e = withCode(new Error('batch'), 'batch_failed');
    e.status = res.status;
    try { e.detail = await res.text(); } catch { /* ignore */ }
    throw e;
  }

  scanDetail.textContent = 'Analyzing results';
  progressBar.style.width = '80%';

  // 3) Parse the NDJSON stream and index real artifacts by package name.
  const lines = parseNdjson(await res.text());
  const byName = new Map();
  for (const a of lines) {
    if (a && a.name && !a._type && !byName.has(a.name)) byName.set(a.name, a);
  }

  // 4) Map each requested package back to its artifact (or mark unresolved).
  const results = packages.map(p => {
    const art = byName.get(p.name);
    if (!art) return { ...p, error: true, alerts: [], score: null };
    return {
      ...p,
      alerts: Array.isArray(art.alerts) ? art.alerts : [],
      score: art.score || null,
      direct: art.direct,
      dead: art.dead,
      resolvedVersion: art.version,
      error: false,
    };
  });

  progressBar.style.width = '100%';
  scanCount.textContent = `${total} / ${total} analyzed`;
  return results;
}

// GET /v0/organizations → pick the slug of the first org on this token.
async function getOrgSlug(authHeader) {
  const res = await fetchWithRetry(apiUrl('/organizations'), {
    headers: { Authorization: authHeader, Accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) throw withCode(new Error('auth'), 'invalid_key');
  if (!res.ok) {
    const e = withCode(new Error('org'), 'org_failed');
    e.status = res.status;
    throw e;
  }
  const data = await res.json();
  const orgs = data && data.organizations ? Object.values(data.organizations) : [];
  const slug = orgs.find(o => o && o.slug)?.slug;
  if (!slug) throw withCode(new Error('no org'), 'no_org');
  return slug;
}

// Build a Package URL (purl) for an npm package. Scoped names (@scope/pkg)
// are valid inside the purl string as-is.
function toPurl(name, version) {
  const hasVersion = version && version !== 'latest';
  return hasVersion ? `pkg:npm/${name}@${version}` : `pkg:npm/${name}`;
}

// Parse newline-delimited JSON, skipping blank or partial lines.
function parseNdjson(text) {
  const out = [];
  for (const line of String(text).split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* skip */ }
  }
  return out;
}

function withCode(err, code) { err.code = code; return err; }

async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429 && attempt < retries) {
        await sleep(1500);
        continue;
      }
      return res;
    } catch {
      if (attempt === retries) throw new Error('Network error');
      await sleep(800);
    }
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Build Report ──
// Invalid/expired keys are caught earlier in scanPackages (thrown as
// 'invalid_key' and surfaced by scanErrorMessage), so by the time we get
// here the results are real artifacts to render.
function buildReport(results, totalScanned) {
  const classified = results.map(classifyPackage);

  // Sort by severity
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3, clean: 4, unknown: 5 };
  classified.sort((a, b) => (sevOrder[a.severity] ?? 5) - (sevOrder[b.severity] ?? 5));

  buildExecSummary(classified, totalScanned);
  buildStats(classified);
  buildPackageTable(classified);
  bindFilterButtons(classified);
  bindNewScan();
  bindCopyReport(classified, totalScanned);
}

function classifyPackage(pkg) {
  // Normalize each Socket alert's severity into our four buckets.
  const rawAlerts = Array.isArray(pkg.alerts) ? pkg.alerts : [];
  const issues = rawAlerts.map(a => ({
    type: a.type,
    severity: normalizeSeverity(a.severity),
    category: a.category,
    action: a.action,
    fix: a.fix,
  }));

  let severity = 'clean';
  if (issues.some(i => i.severity === 'critical'))    severity = 'critical';
  else if (issues.some(i => i.severity === 'high'))   severity = 'high';
  else if (issues.some(i => i.severity === 'medium')) severity = 'medium';
  else if (issues.some(i => i.severity === 'low'))    severity = 'low';
  else if (pkg.error) severity = 'unknown';

  // Socket scores are 0–1 floats; present them as 0–100.
  const s = pkg.score || {};
  const pct = v => (v === undefined || v === null) ? null : Math.round(v > 1 ? v : v * 100);

  return {
    ...pkg,
    severity,
    issues,
    overallScore:       pct(s.overall),
    supplyChainScore:   pct(s.supplyChain),
    maintenanceScore:   pct(s.maintenance),
    vulnerabilityScore: pct(s.vulnerability),
    qualityScore:       pct(s.quality),
    licenseScore:       pct(s.license),
  };
}

// Socket alert severities are: low | middle | high | critical (note: "middle").
function normalizeSeverity(sev) {
  const s = String(sev || '').toLowerCase();
  if (s === 'critical') return 'critical';
  if (s === 'high') return 'high';
  if (s === 'medium' || s === 'middle' || s === 'warn' || s === 'warning') return 'medium';
  return 'low';
}

// ── Executive Summary ──
function buildExecSummary(classified, totalScanned) {
  const counts = countBySeverity(classified);
  const topSeverity = getTopSeverity(counts);

  // Headline
  const headlines = {
    critical: `Critical Risk Detected — Immediate Action Required`,
    high:     `High Risk — Several Packages Require Review`,
    medium:   `Moderate Risk — Review Flagged Packages`,
    low:      `Low Risk — Minor Issues Detected`,
    clean:    `Clean — No Issues Found`,
  };
  execHeadline.textContent = headlines[topSeverity] || 'Scan Complete';

  // Badge
  execBadge.className = 'exec-badge ' + topSeverity;
  execRiskLabel.textContent = capitalize(topSeverity) + ' Risk';
  if (topSeverity === 'clean') execRiskLabel.textContent = 'All Clear';

  // Body copy
  execBody.textContent = generateExecBody(counts, totalScanned, topSeverity);

  // Meta
  const scanned = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  execMeta.innerHTML = `
    <div class="exec-meta-item"><div class="exec-meta-label">Scanned</div><div class="exec-meta-value">${scanned}</div></div>
    <div class="exec-meta-item"><div class="exec-meta-label">Total Packages</div><div class="exec-meta-value">${totalScanned}</div></div>
    <div class="exec-meta-item"><div class="exec-meta-label">Flagged</div><div class="exec-meta-value">${totalScanned - counts.clean - counts.unknown}</div></div>
    <div class="exec-meta-item"><div class="exec-meta-label">Ecosystem</div><div class="exec-meta-value">npm</div></div>
  `;
}

function generateExecBody(counts, total, topSeverity) {
  const flagged = total - counts.clean - counts.unknown;
  const pct = Math.round((flagged / total) * 100);

  if (topSeverity === 'clean') {
    return `All ${total} packages passed Socket's security checks with no issues detected. Your dependency graph appears healthy — continue monitoring as new vulnerabilities are discovered continuously.`;
  }

  let body = `This project's dependency graph contains ${total} packages, of which ${flagged} (${pct}%) triggered at least one security alert. `;

  if (counts.critical > 0) {
    body += `${counts.critical} package${counts.critical > 1 ? 's' : ''} received a Critical rating — these carry the highest risk of active exploitation, data exfiltration, or supply chain compromise and should be addressed before this code ships to production. `;
  }
  if (counts.high > 0) {
    body += `${counts.high} High-severity package${counts.high > 1 ? 's were' : ' was'} also identified and should be reviewed by your security team within the next sprint. `;
  }

  body += `A CISO reviewing this report should treat any Critical findings as a blocker and escalate High findings to the development team for immediate remediation.`;
  return body;
}

// ── Stats ──
function buildStats(classified) {
  const counts = countBySeverity(classified);
  statsGrid.innerHTML = `
    <div class="stat-card total">
      <div class="stat-number">${classified.length}</div>
      <div class="stat-label">Total Packages</div>
    </div>
    <div class="stat-card critical">
      <div class="stat-number">${counts.critical}</div>
      <div class="stat-label">Critical</div>
    </div>
    <div class="stat-card high">
      <div class="stat-number">${counts.high}</div>
      <div class="stat-label">High</div>
    </div>
    <div class="stat-card medium">
      <div class="stat-number">${counts.medium}</div>
      <div class="stat-label">Medium</div>
    </div>
    <div class="stat-card low">
      <div class="stat-number">${counts.clean + counts.low}</div>
      <div class="stat-label">Low / Clean</div>
    </div>
  `;
}

// ── Package Table ──
function buildPackageTable(classified) {
  packageTable.innerHTML = '';
  classified.forEach((pkg, idx) => {
    packageTable.appendChild(buildPackageRow(pkg, idx));
  });
}

function buildPackageRow(pkg, idx) {
  const row = document.createElement('div');
  row.className = 'pkg-row';
  row.dataset.severity = pkg.severity;

  const alertsHTML = buildAlertChips(pkg.issues);
  const chevron = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  row.innerHTML = `
    <div class="pkg-row-header">
      <span class="pkg-name">${escHtml(pkg.name)}</span>
      <span class="pkg-version">${escHtml(pkg.rawVersion || pkg.version)}</span>
      <span class="pkg-severity sev-${pkg.severity}">${formatSeverity(pkg.severity)}</span>
      <div class="pkg-alerts">${alertsHTML || '<span style="color:var(--text-dim);font-size:12px;">No alerts</span>'}</div>
      <span class="pkg-chevron">${chevron}</span>
    </div>
    <div class="pkg-row-detail">${buildDetailHTML(pkg)}</div>
  `;

  row.querySelector('.pkg-row-header').addEventListener('click', () => {
    row.classList.toggle('expanded');
  });

  return row;
}

function buildAlertChips(issues) {
  if (!issues || issues.length === 0) return '';
  // Deduplicate by type
  const seen = new Set();
  return issues
    .filter(i => { if (seen.has(i.type)) return false; seen.add(i.type); return true; })
    .slice(0, 5)
    .map(i => `<span class="alert-chip chip-${i.severity || ''}">${formatAlertType(i.type)}</span>`)
    .join('');
}

function buildDetailHTML(pkg) {
  const scoreBar = (val, color) => {
    if (val === null) return '<span style="color:var(--text-dim)">N/A</span>';
    const c = val >= 80 ? 'var(--green)' : val >= 50 ? 'var(--yellow)' : 'var(--red)';
    return `${val}/100<div class="score-bar-wrap"><div class="score-bar" style="width:${val}%;background:${c}"></div></div>`;
  };

  const issuesHTML = (pkg.error && !pkg.issues?.length)
    ? `<p style="color:var(--text-dim);font-size:13px;">Unable to retrieve scan data for this package.</p>`
    : pkg.issues?.length
      ? pkg.issues.slice(0, 8).map(i => `
        <div class="issue-item">
          <div class="issue-item-title" style="color:${severityColor(i.severity)}">${formatAlertType(i.type)}<span style="margin-left:8px;font-size:11px;opacity:.6">${capitalize(i.severity || 'info')}</span></div>
          <div class="issue-item-desc">${escHtml(i.description || i.value || getAlertDescription(i.type))}</div>
        </div>`).join('')
      : `<p style="color:var(--green);font-size:13px;">✓ No issues detected for this package.</p>`;

  return `
    <div class="detail-grid">
      <div class="detail-item">
        <div class="detail-label">Overall Score</div>
        <div class="detail-value">${scoreBar(pkg.overallScore)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Supply Chain</div>
        <div class="detail-value">${scoreBar(pkg.supplyChainScore)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Vulnerability</div>
        <div class="detail-value">${scoreBar(pkg.vulnerabilityScore)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Maintenance</div>
        <div class="detail-value">${scoreBar(pkg.maintenanceScore)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Quality</div>
        <div class="detail-value">${scoreBar(pkg.qualityScore)}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Alerts Found</div>
        <div class="detail-value" style="font-size:18px;font-weight:700;color:${pkg.issues?.length ? severityColor(pkg.severity) : 'var(--green)'}">${pkg.issues?.length || 0}</div>
      </div>
    </div>
    <div class="detail-label" style="margin-bottom:8px">Socket Alerts</div>
    <div class="detail-issues">${issuesHTML}</div>
  `;
}

// ── Filter buttons ──
function bindFilterButtons(classified) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.pkg-row').forEach(row => {
        const sev = row.dataset.severity;
        if (filter === 'all') {
          row.classList.remove('hidden');
        } else if (filter === 'low') {
          row.classList.toggle('hidden', sev !== 'low' && sev !== 'clean' && sev !== 'unknown');
        } else {
          row.classList.toggle('hidden', sev !== filter);
        }
      });
    });
  });
}

// ── New Scan ──
function bindNewScan() {
  newScanBtn.onclick = () => {
    currentResults = [];
    showScreen('screen-input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

// ── Copy Report ──
function bindCopyReport(classified, total) {
  copyReportBtn.onclick = () => {
    const counts = countBySeverity(classified);
    const lines = [
      `Supply Chain Risk Report — ${new Date().toLocaleDateString()}`,
      `Powered by Socket.dev`,
      ``,
      `SUMMARY`,
      `Total packages scanned: ${total}`,
      `Critical: ${counts.critical} | High: ${counts.high} | Medium: ${counts.medium} | Low/Clean: ${counts.low + counts.clean}`,
      ``,
      `FLAGGED PACKAGES`,
      ...classified
        .filter(p => p.severity !== 'clean' && p.severity !== 'unknown')
        .map(p => `• ${p.name}@${p.rawVersion} — ${capitalize(p.severity)} — ${p.issues.map(i => formatAlertType(i.type)).join(', ')}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      copyReportBtn.textContent = 'Copied!';
      setTimeout(() => { copyReportBtn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15"><rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M13 7V5a1.5 1.5 0 00-1.5-1.5h-7A1.5 1.5 0 003 5v7A1.5 1.5 0 004.5 13.5H7" stroke="currentColor" stroke-width="1.5"/></svg> Copy Report Summary`; }, 2000);
    });
  };
}

// ── Helpers ──
function countBySeverity(classified) {
  return classified.reduce((acc, p) => {
    acc[p.severity] = (acc[p.severity] || 0) + 1;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0, clean: 0, unknown: 0 });
}

function getTopSeverity(counts) {
  if (counts.critical > 0) return 'critical';
  if (counts.high > 0)     return 'high';
  if (counts.medium > 0)   return 'medium';
  if (counts.low > 0)      return 'low';
  return 'clean';
}

function severityColor(sev) {
  return { critical: 'var(--critical)', high: 'var(--high)', medium: 'var(--medium)', low: 'var(--low)', clean: 'var(--clean)' }[sev] || 'var(--text-muted)';
}

function formatSeverity(sev) {
  return { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', clean: 'Clean', unknown: 'Unknown' }[sev] || 'Unknown';
}

function formatAlertType(type) {
  if (!type) return 'Unknown';
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

function getAlertDescription(type) {
  const map = {
    malware:             'This package has been flagged as containing malicious code.',
    installScripts:      'Contains install scripts (preinstall/postinstall) that execute code during npm install.',
    obfuscatedCode:      'Contains obfuscated JavaScript, which is a common technique used to hide malicious behavior.',
    typosquatting:       'Package name closely resembles a popular package and may be a typosquat.',
    deprecatedPackage:   'This package is deprecated and no longer maintained.',
    unmaintained:        'This package has not been updated in a long time.',
    newPackage:          'This is a very recently published package with little community vetting.',
    noTests:             'Package has no test suite, making it harder to verify correctness.',
    unstableOwnership:   'Recent ownership transfer detected — common attack vector for supply chain compromise.',
    suspiciousStrings:   'Contains strings commonly associated with malicious activity.',
    gitDependency:       'Depends directly on a git repository rather than a published package version.',
    envVars:             'Accesses environment variables, which may indicate credential harvesting.',
    filesystemAccess:    'Performs unexpected filesystem operations.',
    networkAccess:       'Makes network requests from install scripts.',
    criticalCVE:         'Has a known critical CVE (Common Vulnerabilities and Exposures).',
    highCVE:             'Has one or more high-severity CVEs.',
    license:             'License may be incompatible with your project.',
  };
  return map[type] || 'Socket detected a potential security concern with this package.';
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
