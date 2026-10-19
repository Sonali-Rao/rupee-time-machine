/*
 * "₹500 never changed": THEN vs TODAY as grids of icons.
 * Both columns share one scale ("each icon = N dosas") so the difference is
 * honest. The TODAY column keeps empty dashed slots for everything that's
 * no longer affordable.
 */
window.RTM = window.RTM || {};

window.RTM.compare = (() => {
  const { DATA, calc, utils } = window.RTM;
  const { h, icon, formatNumber, formatRupees, replayAnimation } = utils;

  const MAX_ICONS = 60;
  let els = {};
  let onItemChange = () => {};

  /**
   * Picks a friendly icon value: …0.02, 0.05, 0.1, 1, 2, 5, 10, 20, 50…
   * Countable items (dosas, tickets) never go below 1 per icon.
   */
  function niceStep(value, allowFraction = false) {
    if (value <= 0) return 1;
    if (!allowFraction && value <= 1) return 1;
    const power = 10 ** Math.floor(Math.log10(value));
    const unit = value / power;
    const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
    return nice * power;
  }

  function init(options) {
    onItemChange = options.onItemChange;
    els = {
      switcher: document.querySelector('[data-compare-switch]'),
      thenCount: document.querySelector('[data-compare-then-count]'),
      nowCount: document.querySelector('[data-compare-now-count]'),
      thenGrid: document.querySelector('[data-compare-then-grid]'),
      nowGrid: document.querySelector('[data-compare-now-grid]'),
      scale: document.querySelector('[data-compare-scale]'),
      summary: document.querySelector('[data-compare-summary]'),
    };
    if (!els.switcher) return;

    DATA.compare.forEach((id, index) => {
      const item = DATA.items[id];
      const inputId = `compare-${id}`;
      const input = h('input', { type: 'radio', name: 'compare-item', id: inputId, value: id });
      if (index === 0) input.checked = true;
      input.addEventListener('change', () => input.checked && onItemChange(id));
      els.switcher.append(
        h('div', { class: 'segmented__option' }, input, h('label', { for: inputId }, icon(item.icon), item.label)),
      );
    });
  }

  function fillGrid(grid, filled, total, iconId) {
    const cells = [];
    for (let i = 0; i < total; i += 1) {
      const cell = h('span', { class: `icon-grid__cell${i >= filled ? ' is-lost' : ''}`, style: { '--i': i } });
      cell.append(icon(iconId));
      cells.push(cell);
    }
    grid.replaceChildren(...cells);
  }

  function update(state, { animate = false } = {}) {
    if (!els.switcher) return;
    const itemId = state.compareItem;
    const item = DATA.items[itemId];
    const radio = document.getElementById(`compare-${itemId}`);
    if (radio) radio.checked = true;

    const then = calc.quantityOf(itemId, state.amount, state.year);
    const now = calc.quantityOf(itemId, state.amount, calc.latest.year);

    els.thenCount.textContent = then.available ? then.text : 'No data';
    els.nowCount.textContent = now.available ? now.text : 'No data';

    const thenRaw = then.available ? then.raw : 0;
    const nowRaw = now.available ? now.raw : 0;
    const step = niceStep(Math.max(thenRaw, nowRaw) / MAX_ICONS, item.decimals > 0);
    const toIcons = (raw) => (raw <= 0 ? 0 : Math.max(1, Math.round(raw / step)));
    const thenIcons = toIcons(thenRaw);
    const nowIcons = toIcons(nowRaw);
    const slots = Math.max(thenIcons, nowIcons);

    fillGrid(els.thenGrid, thenIcons, thenIcons, item.icon);
    fillGrid(els.nowGrid, nowIcons, slots, item.icon);

    const unitWord = step === 1 ? item.unit : item.units;
    const stepDecimals = step < 1 ? Math.ceil(-Math.log10(step) - 1e-9) : 0;
    const stepText = formatNumber(step, stepDecimals);
    els.scale.textContent = `Each icon ≈ ${stepText} ${unitWord}. Dashed circles show what today’s ${formatRupees(state.amount)} can no longer buy.`;

    // Summary sentence
    const ratio = calc.timesMore(itemId, state.year);
    els.summary.replaceChildren();
    if (state.year === calc.latest.year) {
      els.summary.textContent = 'You’re in the present day. Pick an earlier year to see the difference.';
    } else if (ratio && ratio > 1.05) {
      els.summary.append(
        `In ${state.year}, the same note bought `,
        h('strong', {}, `about ${formatNumber(ratio, 1)}× as many ${item.units}`),
        ` as it does in ${calc.latest.year}.`,
      );
    } else if (ratio && ratio < 0.95) {
      els.summary.append(
        `Surprise: ${item.units} cost more in ${state.year} than today, so the same note buys `,
        h('strong', {}, `about ${formatNumber(1 / ratio, 1)}× more`),
        ' now.',
      );
    } else if (ratio) {
      els.summary.textContent = `In this sample data, ${item.units} cost about the same in ${state.year} as they do today.`;
    } else {
      els.summary.textContent = 'There isn’t enough data to compare this item for the selected year.';
    }

    if (animate) {
      replayAnimation(els.thenGrid, 'is-animating');
      replayAnimation(els.nowGrid, 'is-animating');
    }
  }

  return { init, update, niceStep };
})();
