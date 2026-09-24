// Optional site features. Uses simulator events; the model remains in model.js.
const $ = id => document.getElementById(id);
const pct = value => `${(value * 100).toFixed(1)}%`;
const storageKey = 'courtside-personal-bests-v1';
const motionKey = 'courtside-reduce-motion-v1';
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const safeWrite = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing may disable storage. */ } };
const escapeCSV = value => `"${String(value ?? '').replaceAll('"', '""')}"`;

const panel = document.createElement('section');
panel.className = 'panel extras-panel';
panel.id = 'extras';
panel.innerHTML = `
  <p class="eyebrow">MORE WAYS TO PLAY</p><h2>Shot lab &amp; session</h2>
  <div class="extras-grid">
    <section class="extras-card" aria-labelledby="replay-heading"><h3 id="replay-heading">Shot replay</h3>
      <svg id="replay-map" viewBox="0 0 200 376" role="img" aria-label="No session shots yet"><rect x="1" y="1" width="198" height="374" rx="9" fill="#bb9360" stroke="#edf6fa" stroke-width="2"/><path d="M5 5h190v366H5zM0 188h200M68 0v76h64V0M12 0v57a95 95 0 0 0 176 0V0" fill="none" stroke="#f7efe2" stroke-width="2"/><circle cx="100" cy="21" r="4" fill="#f26b38"/></svg>
      <p id="replay-caption" class="small" role="status">Shoot to build a replay. Green = make; orange = miss.</p><ol id="replay-list" class="replay-list" aria-label="Recent shot results"></ol>
    </section>
    <section class="extras-card" aria-labelledby="share-heading"><h3 id="share-heading">Share your last shot</h3><p class="small">Download a result card with the player, spot, estimate, result, and score.</p><button id="download-card" disabled>Download result card (PNG)</button><p id="share-status" class="small" role="status"></p></section>
    <section class="extras-card" aria-labelledby="best-heading"><h3 id="best-heading">Your personal bests</h3><p class="small">Saved on this device only. Guess accuracy is the lowest average error after at least three guesses.</p><dl class="best-list"><div><dt>Best guess accuracy</dt><dd id="best-guess">—</dd></div><div><dt>Most makes</dt><dd id="best-makes">0</dd></div><div><dt>Longest make streak</dt><dd id="best-streak">0</dd></div></dl><button id="clear-bests">Clear personal bests</button></section>
    <section class="extras-card" aria-labelledby="tools-heading"><h3 id="tools-heading">Session tools</h3><button id="export-shots" disabled>Download shot history (CSV)</button><p class="small">Includes shots from this visit, plus your guesses when available.</p><button id="reduce-motion" aria-pressed="false">Reduce motion: off</button><p class="small">Keyboard: <kbd>S</kbd> quick shot · <kbd>H</kbd> hot zones · <kbd>R</kbd> reset score · <kbd>?</kbd> shortcuts. Arrow keys move on the court map.</p><p id="shortcut-status" class="sr-only" role="status" aria-live="polite"></p></section>
  </div>`;
document.querySelector('.game-panel')?.after(panel);

const spotlight = document.createElement('section');
spotlight.className = 'spotlight';
spotlight.innerHTML = '<h3>OKC player spotlight</h3><p class="small">Jump to a Thunder player’s shooting record or hot zones.</p><div id="spotlight-list" class="spotlight-list"></div>';
document.querySelector('.roster')?.append(spotlight);

const whatif = document.createElement('section');
whatif.className = 'whatif';
whatif.innerHTML = '<h3>What if the defender moves?</h3><label for="defender-slider">Preview defender distance: <output id="defender-feet" for="defender-slider">4 ft</output></label><input id="defender-slider" type="range" min="1" max="12" step="0.5" value="4"><p id="defender-preview" role="status" aria-live="polite">Choose players to compare estimates.</p><p class="small">Preview only. The pressure setting above controls the actual shot. Distance effects are interpolated between the 2 ft, 4 ft, and 8 ft pressure assumptions; this is a model scenario, not measured matchup tracking.</p>';
$('estimate-detail')?.after(whatif);

const tapButton = document.createElement('button');
tapButton.id = 'tap-shoot';
tapButton.className = 'primary tap-shoot';
tapButton.type = 'button';
tapButton.textContent = 'Tap to shoot now';
tapButton.setAttribute('aria-label', 'Tap to take a quick shot with no timing bonus');
$('charge-shot')?.after(tapButton);
tapButton.addEventListener('click', () => $('shoot')?.click());

let state = null, history = [], makes = 0, streak = 0, guessCount = 0, guessError = 0;
let bests = safeRead(storageKey, { guess: null, makes: 0, streak: 0 });
if (!bests || typeof bests !== 'object') bests = { guess: null, makes: 0, streak: 0 };
const announce = message => { $('shortcut-status').textContent = message; };
function renderBests() {
  $('best-guess').textContent = Number.isFinite(bests.guess) ? `${bests.guess.toFixed(1)} percentage points` : '—';
  $('best-makes').textContent = String(bests.makes || 0);
  $('best-streak').textContent = String(bests.streak || 0);
}
renderBests();

function renderPreview() {
  const feet = Number($('defender-slider').value);
  $('defender-feet').textContent = `${feet.toFixed(1)} ft`;
  if (!state || typeof window.courtsidePreview !== 'function') return;
  const preview = window.courtsidePreview(feet);
  const change = (preview.p - state.chance) * 100;
  $('defender-preview').textContent = `${state.player} from ${state.zone}: ${pct(preview.p)} at ${feet.toFixed(1)} ft (${change >= 0 ? '+' : ''}${change.toFixed(1)} points versus the selected ${state.pressure} pressure).`;
}
$('defender-slider').addEventListener('input', renderPreview);
window.addEventListener('courtside:estimate', event => { state = event.detail; renderPreview(); });

function drawReplay() {
  const svg = $('replay-map');
  svg.querySelectorAll('.replay-shot').forEach(node => node.remove());
  const recent = history.slice(-10);
  recent.forEach((shot, index) => {
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('class', 'replay-shot');
    marker.setAttribute('cx', String(Math.max(6, Math.min(194, 100 + shot.x * 4))));
    marker.setAttribute('cy', String(Math.max(6, Math.min(370, 21 + shot.y * 4))));
    marker.setAttribute('r', '6');
    marker.setAttribute('fill', shot.made ? '#40df99' : '#ff8b4a');
    marker.setAttribute('stroke', '#081522');
    marker.setAttribute('stroke-width', '2');
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${index + 1}: ${shot.playerName}, ${shot.zone}, ${shot.made ? 'made' : 'missed'}`;
    marker.append(title); svg.append(marker);
  });
  const description = recent.length ? `Last ${recent.length} shots: ${recent.map(s => s.made ? 'make' : 'miss').join(', ')}` : 'No session shots yet';
  svg.setAttribute('aria-label', description);
  $('replay-caption').textContent = recent.length ? description : 'Shoot to build a replay. Green = make; orange = miss.';
  $('replay-list').replaceChildren(...recent.slice().reverse().map(shot => {
    const item = document.createElement('li');
    item.textContent = `${shot.made ? 'Made' : 'Missed'} · ${shot.playerName} · ${shot.zone}`;
    return item;
  }));
  $('download-card').disabled = !history.length;
  $('export-shots').disabled = !history.length;
}
window.addEventListener('courtside:shot', event => {
  const shot = { ...event.detail };
  history.push(shot);
  makes += Number(shot.made);
  streak = shot.made ? streak + 1 : 0;
  bests.makes = Math.max(bests.makes || 0, makes);
  bests.streak = Math.max(bests.streak || 0, streak);
  safeWrite(storageKey, bests); renderBests(); drawReplay();
  announce(`${shot.playerName} ${shot.made ? 'made' : 'missed'} from ${shot.zone}. Estimated make chance ${pct(shot.estimate)}. Score ${shot.score}.`);
});
window.addEventListener('courtside:guess', event => {
  const { error, averageError, count, guess } = event.detail;
  guessCount = count; guessError = averageError;
  if (guessCount >= 3 && (!Number.isFinite(bests.guess) || guessError < bests.guess)) {
    bests.guess = guessError; safeWrite(storageKey, bests); renderBests();
  }
  if (history.length) { history[history.length - 1].guess = guess; history[history.length - 1].guessError = error; }
});
window.addEventListener('courtside:reset', () => { makes = 0; streak = 0; guessCount = 0; guessError = 0; announce('Score and current guessing session reset. Shot history remains until cleared.'); });
window.addEventListener('courtside:history-clear', () => { history = []; drawReplay(); announce('Shot history cleared.'); });
$('clear-bests').addEventListener('click', () => { bests = { guess: null, makes: 0, streak: 0 }; safeWrite(storageKey, bests); renderBests(); announce('Personal bests cleared on this device.'); });

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
$('export-shots').addEventListener('click', () => {
  if (!history.length) return;
  const columns = ['timestamp', 'playerName', 'defenderName', 'zone', 'x', 'y', 'pressure', 'defenderDistance', 'estimate', 'chance', 'made', 'makes', 'attempts', 'guess', 'guessError'];
  const csv = [columns.join(','), ...history.map(shot => columns.map(key => escapeCSV(shot[key])).join(','))].join('\r\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'courtside-shot-history.csv');
  announce(`Downloaded ${history.length} shots as CSV.`);
});
$('download-card').addEventListener('click', () => {
  const shot = history.at(-1); if (!shot) return;
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 675;
  const c = canvas.getContext('2d'); if (!c) { $('share-status').textContent = 'Image download is not available in this browser.'; return; }
  c.fillStyle = '#071426'; c.fillRect(0, 0, 1200, 675);
  c.fillStyle = '#1989c8'; c.fillRect(0, 0, 1200, 14);
  c.fillStyle = '#f26b38'; c.fillRect(0, 661, 1200, 14);
  c.fillStyle = '#70ccef'; c.font = 'bold 28px system-ui'; c.fillText('FREDDY LYNCH · COURTSIDE', 72, 88);
  c.fillStyle = '#ffffff'; c.font = 'bold 64px system-ui'; c.fillText(shot.made ? 'BUCKET.' : 'OFF THE RIM.', 72, 185);
  c.font = 'bold 44px system-ui'; c.fillText(shot.playerName, 72, 270);
  c.fillStyle = '#a9c4d8'; c.font = '30px system-ui'; c.fillText(`${shot.zone} · ${Math.hypot(shot.x, shot.y).toFixed(1)} ft`, 72, 329);
  c.fillText(`Defender: ${shot.defenderName}`, 72, 382);
  c.fillText(`Estimated chance: ${pct(shot.estimate)}`, 72, 450);
  c.fillText(`Shot chance with timing: ${pct(shot.chance)}`, 72, 497);
  c.fillStyle = '#70ccef'; c.font = 'bold 38px system-ui'; c.fillText(`SCORE  ${shot.score}`, 72, 580);
  c.strokeStyle = '#a9c4d8'; c.lineWidth = 5; c.strokeRect(890, 180, 240, 380);
  c.beginPath(); c.arc(1010, 220, 12, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(1010, 220, 108, 0, Math.PI); c.stroke();
  c.fillStyle = shot.made ? '#40df99' : '#ff8b4a'; c.beginPath();
  c.arc(1010 + shot.x * 4, Math.max(190, Math.min(530, 220 + shot.y * 4)), 13, 0, Math.PI * 2); c.fill();
  canvas.toBlob(blob => {
    if (!blob) { $('share-status').textContent = 'Image download is not available in this browser.'; return; }
    downloadBlob(blob, 'courtside-last-shot.png'); $('share-status').textContent = 'Downloaded your last shot card.';
  }, 'image/png');
});

window.addEventListener('courtside:ready', event => {
  const players = event.detail.players.filter(p => p.team === 'OKC');
  const choices = ['Shai Gilgeous-Alexander', 'Chet Holmgren', 'Jalen Williams', 'Luguentz Dort']
    .map(name => players.find(p => p.name === name)).filter(Boolean);
  const target = $('spotlight-list'); target.replaceChildren();
  for (const player of choices) {
    const card = document.createElement('div'); card.className = 'spotlight-player';
    const name = document.createElement('strong'); name.textContent = player.name;
    const record = document.createElement('span'); record.textContent = `${player.fgm} / ${player.fga} FG · ${player.fga ? pct(player.fgm / player.fga) : '—'}`;
    const selectPlayer = section => {
      $('off-search').value = player.name; $('off-search').dispatchEvent(new Event('input', { bubbles: true }));
      $('off-list').value = String(player.id); $('off-list').dispatchEvent(new Event('change', { bubbles: true }));
      $(section).scrollIntoView({ behavior: document.body.classList.contains('reduce-motion') ? 'auto' : 'smooth', block: 'start' });
      announce(`${player.name} selected. ${section === 'hot-zones' ? 'Hot zones' : 'Shooting record'} shown.`);
    };
    const hot = document.createElement('button'); hot.textContent = 'Hot zones'; hot.addEventListener('click', () => selectPlayer('hot-zones'));
    const stats = document.createElement('button'); stats.textContent = 'Shooting record'; stats.addEventListener('click', () => selectPlayer('off-card'));
    card.append(name, record, hot, stats); target.append(card);
  }
});

const motionButton = $('reduce-motion');
let reduceMotion = safeRead(motionKey, matchMedia('(prefers-reduced-motion: reduce)').matches);
function updateMotion() {
  document.body.classList.toggle('reduce-motion', Boolean(reduceMotion));
  motionButton.setAttribute('aria-pressed', String(Boolean(reduceMotion)));
  motionButton.textContent = `Reduce motion: ${reduceMotion ? 'on' : 'off'}`;
}
updateMotion();
motionButton.addEventListener('click', () => { reduceMotion = !reduceMotion; safeWrite(motionKey, reduceMotion); updateMotion(); announce(`Reduced motion ${reduceMotion ? 'enabled' : 'disabled'}.`); });

document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName) || event.target.isContentEditable) return;
  const key = event.key.toLowerCase();
  if (key === 's') { event.preventDefault(); $('shoot')?.click(); }
  else if (key === 'h') { event.preventDefault(); $('hot-zones')?.scrollIntoView({ block: 'start' }); announce('Player hot zones.'); }
  else if (key === 'r') { event.preventDefault(); $('reset')?.click(); }
  else if (event.key === '?') { event.preventDefault(); announce('Shortcuts: S quick shot, H hot zones, R reset score. Arrow keys move the court position when the map is focused.'); }
});
