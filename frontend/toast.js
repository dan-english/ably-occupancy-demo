// ── Toast notifications ────────────────────────────────────────────────────
// Lightweight toast UI, no dependencies. Call showToast() to display one.

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * @param {string} message - Text to display.
 * @param {'info'|'success'|'error'} type - Visual style.
 * @param {number} duration - Milliseconds before auto-dismiss.
 */
export function showToast(message, type = 'info', duration = 5000) {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;

  el.addEventListener('click', () => dismiss(el));
  getContainer().appendChild(el);

  // Trigger enter transition on next frame.
  requestAnimationFrame(() => el.classList.add('toast-visible'));

  setTimeout(() => dismiss(el), duration);
}

function dismiss(el) {
  if (!el.isConnected) return;
  el.classList.remove('toast-visible');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
}
