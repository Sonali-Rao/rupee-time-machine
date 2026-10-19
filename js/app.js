/*
 * app.js: owns the state and wires the components together.
 *
 *   state = { amount, year, compareItem }
 *
 * Every change goes through setState(), which re-renders each component.
 * Components never talk to each other directly.
 */
(() => {
  'use strict';

  const { DATA, calc, utils } = window.RTM;
  const { formatRupees, formatNumber, debounce, prefersReducedMotion } = utils;
  const components = ['yearSlider', 'results', 'compare', 'journey', 'extras', 'explainer', 'chart', 'dataTable', 'share']
    .map((name) => window.RTM[name]);

  const MIN_AMOUNT = 1;
  const MAX_AMOUNT = 100000000;   // ₹10 crore

  /* ---------- Initial state: URL params → defaults ---------- */
  const params = new URLSearchParams(window.location.search);
  const parseAmount = (raw) => {
    const cleaned = String(raw ?? '').replace(/[₹,\s]/g, '');
    if (!/^\d+$/.test(cleaned)) return null;
    const value = Number(cleaned);
    return value >= MIN_AMOUNT && value <= MAX_AMOUNT ? value : null;
  };

  let state = {
    amount: parseAmount(params.get('amount')) ?? DATA.defaults.amount,
    year: calc.nearestYear(Number(params.get('year')) || DATA.defaults.year),
    compareItem: DATA.compare[0],
  };

  /* ---------- Elements ---------- */
  const form = document.getElementById('machine');
  const amountInput = document.getElementById('amount');
  const amountWrap = amountInput.closest('.amount-input');
  const amountError = document.getElementById('amount-error');
  const chips = Array.from(document.querySelectorAll('[data-amount-chips] .chip'));
  const announcer = document.querySelector('[data-announcer]');
  const resultsTitle = document.getElementById('results-title');
  const yearFlip = document.querySelector('[data-year-flip]');

  /* ---------- Text bindings shared across the page ---------- */
  function updateBindings(prev) {
    const amountText = formatRupees(state.amount);
    document.querySelectorAll('[data-amount-text]').forEach((el) => (el.textContent = amountText));
    document.querySelectorAll('[data-year-text]').forEach((el) => (el.textContent = state.year));
    document.querySelectorAll('[data-latest-year]').forEach((el) => (el.textContent = calc.latest.year));
    document.querySelectorAll('[data-serial]').forEach((el) => {
      el.textContent = `No. RTM·${state.year}·${String(state.amount).padStart(6, '0').slice(-6)}`;
    });

    if (yearFlip) {
      yearFlip.textContent = state.year;
      if (prev && prev.year !== state.year) utils.replayAnimation(yearFlip, 'is-flipping');
    }

    chips.forEach((chip) => chip.setAttribute('aria-pressed', String(Number(chip.dataset.amount) === state.amount)));
  }

  /* ---------- Screen-reader summary (debounced so dragging doesn't spam) ---------- */
  const announce = debounce(() => {
    const parts = DATA.featured
      .map((id) => calc.quantityOf(id, state.amount, state.year))
      .filter((q) => q.available)
      .map((q) => (q.item.shortUnit ? `${q.text} of ${q.item.label.toLowerCase()}` : q.text));
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
    announcer.textContent = `${formatRupees(state.amount)} in ${state.year} could buy about ${list}.`;
  }, 600);

  /* ---------- State ---------- */
  function setState(patch, options = {}) {
    const prev = state;
    state = { ...state, ...patch };
    const yearChanged = prev.year !== state.year;
    const amountChanged = prev.amount !== state.amount;

    updateBindings(prev);
    components.forEach((component) => {
      component?.update(state, {
        stamp: options.stamp || (yearChanged && !options.quiet),
        animate: yearChanged || amountChanged || options.animate,
      });
    });

    if (!options.fromJourney && window.RTM.journey.isPlaying()) window.RTM.journey.stop();
    if (!options.silent) announce();

    const url = new URL(window.location.href);
    url.searchParams.set('amount', state.amount);
    url.searchParams.set('year', state.year);
    window.history.replaceState(null, '', url);
  }

  /* ---------- Amount input ---------- */
  function showAmountError(message) {
    amountError.textContent = message;
    amountError.hidden = !message;
    amountInput.setAttribute('aria-invalid', String(Boolean(message)));
    if (message) amountWrap.setAttribute('data-invalid', '');
    else amountWrap.removeAttribute('data-invalid');
  }

  function readAmount() {
    const raw = amountInput.value.trim();
    if (!raw) return { error: 'Enter an amount in rupees, for example 500.' };
    const cleaned = raw.replace(/[₹,\s]/g, '');
    if (!/^\d+$/.test(cleaned)) return { error: 'Use whole rupees only: digits, no decimals or letters.' };
    const value = Number(cleaned);
    if (value < MIN_AMOUNT) return { error: 'The amount must be at least ₹1.' };
    if (value > MAX_AMOUNT) return { error: `The amount must be ₹${formatNumber(MAX_AMOUNT)} or less.` };
    return { value };
  }

  amountInput.addEventListener('input', () => {
    const { value, error } = readAmount();
    if (error) {
      showAmountError(error);
      return;
    }
    showAmountError('');
    if (value !== state.amount) setState({ amount: value }, { quiet: true });
  });

  amountInput.addEventListener('blur', () => {
    const { error } = readAmount();
    if (!error) amountInput.value = formatNumber(state.amount);
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const value = Number(chip.dataset.amount);
      amountInput.value = formatNumber(value);
      showAmountError('');
      setState({ amount: value }, { quiet: true });
    });
  });

  /* ---------- Time travel ---------- */
  function travel(originEl) {
    // The route marker slides along the ticket and a warm wash sweeps the page.
    if (!prefersReducedMotion()) {
      form.classList.remove('is-travelling');
      void form.offsetWidth;
      form.classList.add('is-travelling');

      const rect = (originEl || form).getBoundingClientRect();
      const wash = document.createElement('div');
      wash.className = 'time-wash';
      wash.setAttribute('aria-hidden', 'true');
      wash.style.setProperty('--wash-x', `${rect.left + rect.width / 2}px`);
      wash.style.setProperty('--wash-y', `${rect.top + rect.height / 2}px`);
      document.body.append(wash);
      wash.addEventListener('animationend', () => wash.remove(), { once: true });
    }

    setState({}, { stamp: true, animate: true, silent: true });

    window.setTimeout(() => {
      document.getElementById('results').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      // Move focus so keyboard and screen-reader users land on the result.
      resultsTitle.focus({ preventScroll: true });
      announce();
    }, prefersReducedMotion() ? 0 : 350);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { value, error } = readAmount();
    if (error) {
      showAmountError(error);
      amountInput.focus();
      return;
    }
    showAmountError('');
    if (value !== state.amount) setState({ amount: value }, { quiet: true, silent: true });
    travel(form.querySelector('[type="submit"]'));
  });

  document.querySelector('[data-surprise]')?.addEventListener('click', (event) => {
    const options = calc.yearList.filter((year) => year !== state.year);
    const year = options[Math.floor(Math.random() * options.length)];
    setState({ year }, { quiet: true, silent: true });
    travel(event.currentTarget);
  });

  /* ---------- Components ---------- */
  const setYear = (year, options = {}) => {
    if (year !== state.year) setState({ year }, options);
  };

  window.RTM.yearSlider.init({ onChange: (year) => setYear(year) });
  window.RTM.results.init();
  window.RTM.compare.init({ onItemChange: (compareItem) => setState({ compareItem }, { animate: true, silent: true }) });
  window.RTM.journey.init({ onSelect: (year, options) => setYear(year, options) });
  window.RTM.extras.init();
  window.RTM.explainer.init();
  window.RTM.chart.init({ onSelect: (year) => setYear(year) });
  window.RTM.dataTable.init();
  window.RTM.share.init();

  // First render (no announcement, no animation).
  amountInput.value = formatNumber(state.amount);
  setState({}, { silent: true, quiet: true });
})();
