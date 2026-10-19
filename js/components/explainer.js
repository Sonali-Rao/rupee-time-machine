/*
 * "Why does ₹500 feel smaller?": the same note, three years, fewer goods.
 * Plays once when scrolled into view; the Replay button plays it again.
 * Also finds a "twist" in the data: an item that got CHEAPER over time.
 */
window.RTM = window.RTM || {};

window.RTM.explainer = (() => {
  const { DATA, calc, utils } = window.RTM;
  const { h, icon, formatRupees, formatNumber, replayAnimation } = utils;

  const MAX_ICONS = 12;
  const ITEM = 'dosa';
  let els = {};

  function init() {
    els = {
      rows: document.querySelector('[data-why-rows]'),
      caption: document.querySelector('[data-why-caption]'),
      twist: document.querySelector('[data-why-twist]'),
      replay: document.querySelector('[data-why-replay]'),
    };
    if (!els.rows) return;

    els.replay?.addEventListener('click', play);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            play();
            observer.disconnect();
          }
        },
        { threshold: 0.4 },
      );
      observer.observe(els.rows);
    }
  }

  function play() {
    replayAnimation(els.rows, 'is-playing');
  }

  /** Earliest, middle and latest years in the dataset. */
  function sampleYears() {
    const years = calc.yearList;
    const unique = [...new Set([years[0], years[Math.floor((years.length - 1) / 2)], years[years.length - 1]])];
    return unique;
  }

  /** Looks for an extra item whose price fell between its first known year and today. */
  function findTwist(amount) {
    for (const id of DATA.extras) {
      const known = calc.years.filter((entry) => entry.prices[id]);
      if (known.length < 2) continue;
      const first = known[0];
      const last = known[known.length - 1];
      if (last.prices[id] < first.prices[id]) {
        return {
          item: DATA.items[id],
          first: calc.quantityOf(id, amount, first.year),
          last: calc.quantityOf(id, amount, last.year),
        };
      }
    }
    return null;
  }

  function update(state) {
    if (!els.rows) return;
    const years = sampleYears();
    const item = DATA.items[ITEM];
    const results = years.map((year) => calc.quantityOf(ITEM, state.amount, year));
    const maxRaw = Math.max(...results.map((r) => (r.available ? r.raw : 0)));
    const step = window.RTM.compare.niceStep(maxRaw / MAX_ICONS);

    const rows = results.map((result, rowIndex) => {
      // Whole icons, plus one partly-clipped icon for the remainder, so a
      // 0.3-dosa difference is still visible and nothing is rounded away.
      const exact = result.available ? result.raw / step : 0;
      const whole = Math.floor(exact);
      const fraction = exact - whole;
      const goods = Array.from({ length: whole }, (_, i) => {
        const svg = icon(item.icon);
        svg.style.setProperty('--i', i);
        return svg;
      });
      if (fraction >= 0.05) {
        const partial = h('span', { class: 'partial-icon', style: { '--fraction': fraction.toFixed(2), '--i': whole } });
        partial.append(icon(item.icon));
        goods.push(partial);
      }
      return h(
        'div',
        { class: 'why-row', style: { '--row': rowIndex } },
        h('span', { class: 'why-row__year' }, result.year),
        h('span', { class: 'mini-note' }, h('span', { class: 'mini-note__value' }, formatRupees(state.amount))),
        icon('i-arrow', 'why-row__arrow'),
        h('span', { class: 'why-row__goods' }, goods),
      );
    });
    els.rows.replaceChildren(...rows);

    const parts = results
      .filter((r) => r.available)
      .map((r) => `${r.year}: about ${r.text}`)
      .join(', ');
    const stepNote = step > 1 ? ` Each dosa icon stands for about ${formatNumber(step)} dosas; a partly drawn icon is a fraction of that.` : '';
    els.caption.textContent = `The same ${formatRupees(state.amount)} note, three different years. ${parts}.${stepNote}`;

    const twist = findTwist(state.amount);
    if (els.twist) {
      els.twist.hidden = !twist;
      if (twist) {
        els.twist.replaceChildren(
          h('strong', {}, 'Not everything gets more expensive. '),
          `In this data, ${formatRupees(state.amount)} bought about ${twist.first.text} of ${twist.item.label.toLowerCase()} in ${twist.first.year}, and about ${twist.last.text} in ${twist.last.year}. Technology and competition can push some prices down.`,
        );
      }
    }
  }

  return { init, update };
})();
