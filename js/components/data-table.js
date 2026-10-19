/*
 * Data transparency: the full dataset table, the sources list and the
 * sample-data notice, all generated straight from data.js.
 */
window.RTM = window.RTM || {};

window.RTM.dataTable = (() => {
  const { DATA, calc, utils } = window.RTM;
  const { h, formatRupees } = utils;

  let rows = new Map();

  function init() {
    const head = document.querySelector('[data-dataset-head]');
    const body = document.querySelector('[data-dataset-body]');
    const sources = document.querySelector('[data-sources]');
    const notice = document.querySelector('[data-data-notice]');
    const caption = document.getElementById('dataset-caption');
    const isSample = DATA.meta.dataStatus !== 'sourced';

    const columns = [...new Set([...DATA.featured, ...DATA.extras])];

    if (head) {
      head.append(
        h(
          'tr',
          {},
          h('th', { scope: 'col' }, 'Year'),
          columns.map((id) => h('th', { scope: 'col' }, `${DATA.items[id].label} (per ${DATA.items[id].priceUnit})`)),
          h('th', { scope: 'col' }, 'Price index'),
        ),
      );
    }

    if (body) {
      calc.years.forEach((entry) => {
        const row = h(
          'tr',
          {},
          h('th', { scope: 'row' }, entry.year),
          columns.map((id) => {
            const price = entry.prices[id];
            return h('td', {}, price === null || price === undefined ? '—' : formatRupees(price));
          }),
          h('td', {}, entry.cpi),
        );
        rows.set(entry.year, row);
        body.append(row);
      });
    }

    if (caption) {
      caption.textContent = isSample
        ? 'Approximate prices by year (₹). Sample data, not verified. “—” means no price in the dataset.'
        : 'Prices by year (₹). “—” means no price in the dataset.';
    }

    if (notice) notice.hidden = !isSample;

    if (sources) {
      const list = DATA.meta.sources || [];
      if (!list.length) {
        sources.append(
          h('p', {}, 'No sources have been added yet. The values are illustrative placeholders. Add references to ', h('code', {}, 'meta.sources'), ' in ', h('code', {}, 'js/data.js'), ' and they will be listed here.'),
        );
      } else {
        sources.append(
          h('ul', { class: 'factor-list' }, list.map((s) => h('li', {}, s.url ? h('a', { href: s.url }, s.label) : s.label))),
        );
      }
    }
  }

  function update(state) {
    rows.forEach((row, year) => row.classList.toggle('is-selected', year === state.year));
  }

  return { init, update };
})();
