(() => {
  const get = id => document.getElementById(id);
  const panel = document.querySelector('.game-panel');
  const chargeButton = get('charge-shot');
  if (!panel || !chargeButton) return;

  const guessPanel = document.createElement('div');
  guessPanel.className = 'guess-panel';
  guessPanel.innerHTML = '<label for="guess-input">GUESS THE SHOT CHANCE <output id="guess-value" for="guess-input">50%</output></label><input id="guess-input" type="range" min="1" max="95" value="50" step="1"><p id="guess-feedback" class="small" role="status">Set your guess before shooting. The estimate is revealed after the shot lands.</p><p id="guess-accuracy" class="small">Guess accuracy: 0 shots</p>';
  panel.querySelector('h2')?.after(guessPanel);

  const input = get('guess-input');
  const value = get('guess-value');
  const feedback = get('guess-feedback');
  const accuracy = get('guess-accuracy');
  let pending = null;
  let shots = 0;
  let totalError = 0;

  input.addEventListener('input', () => { value.textContent = `${input.value}%`; });
  const capture = () => {
    const chance = Number.parseFloat(get('chance')?.textContent || '');
    if (Number.isFinite(chance)) pending = { guess: Number(input.value), chance };
  };
  get('shoot')?.addEventListener('click', capture, true);
  chargeButton.addEventListener('pointerdown', capture, true);
  get('reset')?.addEventListener('click', () => {
    pending = null;
    shots = 0;
    totalError = 0;
    feedback.textContent = 'Set your guess before shooting. The estimate is revealed after the shot lands.';
    accuracy.textContent = 'Guess accuracy: 0 shots';
  });

  const observer = new MutationObserver(() => {
    if (!pending) return;
    const result = get('result')?.textContent || '';
    if (!['Bucket.', 'Off the rim.'].includes(result)) return;
    const error = Math.abs(pending.guess - pending.chance);
    shots += 1;
    totalError += error;
    feedback.textContent = `Model estimate revealed: ${pending.chance.toFixed(1)}%. Your guess was ${pending.guess}%. You were off by ${error.toFixed(1)} points.`;
    accuracy.textContent = `Guess accuracy: ${shots} shot${shots === 1 ? '' : 's'} · average error ${(totalError / shots).toFixed(1)} points`;
    pending = null;
  });
  observer.observe(get('result'), { childList: true, characterData: true, subtree: true });
})();
