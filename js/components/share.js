/*
 * "Share my result": Web Share API → clipboard → a selectable text box.
 * No backend needed; the link carries ?amount=…&year=… so it reopens the same result.
 */
window.RTM = window.RTM || {};

window.RTM.share = (() => {
  const { DATA, calc, utils } = window.RTM;
  const { formatRupees } = utils;

  let els = {};
  let state = null;

  function shareUrl() {
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.set('amount', state.amount);
    url.searchParams.set('year', state.year);
    return url.toString();
  }

  function shareText() {
    const first = calc.quantityOf(DATA.featured[0], state.amount, state.year);
    const what = first.available ? `approximately ${first.text}` : 'surprisingly different things';
    return `My ${formatRupees(state.amount)} in ${state.year} could buy ${what}. What could yours buy? Try the Rupee Time Machine:`;
  }

  function showFallback(text) {
    els.fallback.hidden = false;
    els.textarea.value = text;
    els.textarea.focus();
    els.textarea.select();
    els.status.textContent = 'Copy the text below to share it.';
  }

  async function handleShare() {
    const text = shareText();
    const url = shareUrl();
    els.fallback.hidden = true;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Rupee Time Machine', text, url });
        els.status.textContent = 'Thanks for sharing!';
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text} ${url}`);
        els.status.textContent = 'Copied! Paste it anywhere to share your result.';
        return;
      }
      showFallback(`${text} ${url}`);
    } catch (error) {
      if (error?.name === 'AbortError') return;   // user closed the share sheet
      showFallback(`${text} ${url}`);
    }
  }

  function init() {
    els = {
      button: document.querySelector('[data-share]'),
      status: document.querySelector('[data-share-status]'),
      fallback: document.querySelector('[data-share-fallback]'),
      textarea: document.querySelector('[data-share-text]'),
    };
    els.button?.addEventListener('click', handleShare);
  }

  function update(nextState) {
    state = nextState;
    if (els.status) els.status.textContent = '';
    if (els.fallback) els.fallback.hidden = true;
  }

  return { init, update, shareUrl };
})();
