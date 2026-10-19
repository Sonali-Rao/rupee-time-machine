/*
 * "Watch your ₹500 travel through time": a dependency-free SVG line chart.
 *
 * Each point = what the chosen amount from that year is worth in the latest
 * year's rupees (CPI-based). The SVG is decorative (aria-hidden); the points
 * are real <button>s layered on top, so the chart works with a mouse, touch,
 * keyboard (roving tabindex + arrow keys) and screen readers. A data table
 * sits underneath as a text alternative.
 */
window.RTM = window.RTM || {};

window.RTM.chart = (() => {
  const { calc, utils } = window.RTM;
  const { h, formatRupees, formatNumber, prefersReducedMotion } = utils;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  let els = {};
  let state = null;
  let onSelect = () => {};
  let points = [];          // { year, value, x, y, button }
  let focusIndex = 0;
  let hasDrawn = false;
  let visible = false;

  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };

  /** Rounds up to a "nice" axis maximum: 1, 2, 2.5, 5 × 10^n */
  function niceCeil(value) {
    if (value <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(value));
    const unit = value / power;
    const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10;
    return nice * power;
  }

  /** Compact Indian-style axis labels: ₹5,000 · ₹1.5 L · ₹2 Cr */
  function compactRupees(value) {
    const trim = (n) => Number(n.toFixed(2)).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    if (value >= 1e7) return `₹${trim(value / 1e7)} Cr`;
    if (value >= 1e5) return `₹${trim(value / 1e5)} L`;
    return formatRupees(Math.round(value));
  }

  function init(options) {
    onSelect = options.onSelect;
    els = {
      canvas: document.querySelector('[data-chart]'),
      tooltip: document.querySelector('[data-chart-tooltip]'),
      table: document.querySelector('[data-chart-table]'),
      figure: document.querySelector('.chart'),
    };
    if (!els.canvas) return;

    if ('ResizeObserver' in window) {
      let lastWidth = 0;
      new ResizeObserver(() => {
        const width = els.canvas.clientWidth;
        if (Math.abs(width - lastWidth) > 1 && state) {
          lastWidth = width;
          render();
        }
      }).observe(els.canvas);
    }

    // Draw the line in when the chart first scrolls into view.
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          visible = true;
          animateLine();
          observer.disconnect();
        }
      }, { threshold: 0.35 });
      observer.observe(els.canvas);
    } else {
      visible = true;
    }

    // Hover anywhere over the plot snaps to the nearest year.
    els.canvas.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || !points.length) return;
      const rect = els.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const nearest = points.reduce((best, p) => (Math.abs(p.x - x) < Math.abs(best.x - x) ? p : best), points[0]);
      showTooltip(points.indexOf(nearest));
    });
    els.canvas.addEventListener('pointerleave', () => {
      if (!els.canvas.contains(document.activeElement)) hideTooltip();
    });
  }

  function animateLine() {
    const line = els.canvas.querySelector('.chart__line');
    if (!line || hasDrawn || prefersReducedMotion() || !visible) return;
    const length = line.getTotalLength();
    line.style.setProperty('--len', length);
    line.style.strokeDasharray = length;
    line.classList.add('is-drawing');
    line.addEventListener('animationend', () => {
      line.style.strokeDasharray = '';
      line.classList.remove('is-drawing');
    }, { once: true });
    hasDrawn = true;
  }

  function tooltipContent(point) {
    const { amount } = state;
    const ratio = point.value / amount;
    const latest = calc.latest.year;
    const sameYear = point.year === latest;
    return [
      h('span', { class: 'micro-label', style: { color: 'inherit' } }, point.year),
      h('strong', {}, `≈ ${formatRupees(Math.round(point.value))}`),
      sameYear
        ? `This is today: ${formatRupees(amount)} is simply worth ${formatRupees(amount)}.`
        : `${formatRupees(amount)} in ${point.year} ≈ ${formatRupees(Math.round(point.value))} in ${latest} rupees. Prices were about ${formatNumber(ratio, 1)}× lower.`,
    ];
  }

  function showTooltip(index) {
    const point = points[index];
    if (!point || !els.tooltip) return;
    points.forEach((p, i) => p.button.classList.toggle('is-active', i === index));
    els.tooltip.replaceChildren(...tooltipContent(point));
    els.tooltip.hidden = false;

    // Position relative to the figure, clamped to stay inside it.
    const offsetX = els.canvas.offsetLeft;
    const offsetY = els.canvas.offsetTop;
    const half = els.tooltip.offsetWidth / 2;
    const figureWidth = els.figure.clientWidth;
    const left = Math.min(Math.max(point.x + offsetX, half + 8), figureWidth - half - 8);
    els.tooltip.style.left = `${left}px`;
    els.tooltip.style.top = `${point.y + offsetY}px`;
    // Flip below the point when there's no room above.
    const flip = point.y < els.tooltip.offsetHeight + 10;
    els.tooltip.style.transform = flip ? 'translate(-50%, 20px)' : '';
  }

  function hideTooltip() {
    if (els.tooltip) els.tooltip.hidden = true;
    points.forEach((p) => p.button.classList.remove('is-active'));
  }

  function moveFocus(index) {
    focusIndex = Math.max(0, Math.min(points.length - 1, index));
    points.forEach((p, i) => (p.button.tabIndex = i === focusIndex ? 0 : -1));
    points[focusIndex].button.focus();
  }

  function render() {
    if (!els.canvas || !state) return;
    const { amount } = state;
    const width = Math.max(280, els.canvas.clientWidth);
    const height = width < 560 ? 260 : 340;
    const pad = { top: 24, right: 24, bottom: 40, left: width < 560 ? 58 : 76 };
    const years = calc.yearList;
    const minYear = years[0];
    const maxYear = years[years.length - 1];

    const data = years.map((year) => ({ year, value: calc.inTodaysMoney(amount, year) }));
    // Round gridline steps (₹2,000 · ₹1 L…) and just enough of them to fit the data.
    const peak = Math.max(...data.map((d) => d.value)) * 1.08;
    const yStep = niceCeil(peak / 4);
    const yTicks = Math.max(2, Math.ceil(peak / yStep));
    const yMax = yStep * yTicks;
    const x = (year) => pad.left + ((year - minYear) / (maxYear - minYear || 1)) * (width - pad.left - pad.right);
    const y = (value) => pad.top + (1 - value / yMax) * (height - pad.top - pad.bottom);

    const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, width, height, 'aria-hidden': 'true', focusable: 'false' });

    const defs = svgEl('defs');
    const gradient = svgEl('linearGradient', { id: 'chart-fill', x1: 0, y1: 0, x2: 0, y2: 1 });
    gradient.append(
      svgEl('stop', { offset: '0%', 'stop-color': '#1f4d3a', 'stop-opacity': '0.28' }),
      svgEl('stop', { offset: '100%', 'stop-color': '#1f4d3a', 'stop-opacity': '0.02' }),
    );
    defs.append(gradient);
    svg.append(defs);

    // Horizontal grid + y labels
    for (let i = 0; i <= yTicks; i += 1) {
      const value = yStep * i;
      const gy = y(value);
      svg.append(svgEl('line', { class: 'chart__grid-line', x1: pad.left, x2: width - pad.right, y1: gy, y2: gy }));
      const label = svgEl('text', { class: 'chart__axis-label', x: pad.left - 10, y: gy + 4, 'text-anchor': 'end' });
      label.textContent = compactRupees(value);
      svg.append(label);
    }

    // X labels (thinned on narrow screens, first and last always shown)
    const every = width < 480 ? 2 : 1;
    data.forEach((d, i) => {
      if (i % every !== 0 && i !== data.length - 1) return;
      const label = svgEl('text', { class: 'chart__axis-label', x: x(d.year), y: height - 12, 'text-anchor': 'middle' });
      label.textContent = d.year;
      svg.append(label);
    });

    // Area + line
    const linePath = data.map((d, i) => `${i ? 'L' : 'M'}${x(d.year).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ');
    const baseY = y(0);
    svg.append(svgEl('path', {
      d: `${linePath} L${x(maxYear).toFixed(1)},${baseY} L${x(minYear).toFixed(1)},${baseY} Z`,
      fill: 'url(#chart-fill)',
    }));

    // Baseline: the amount itself, today
    const by = y(amount);
    svg.append(svgEl('line', { class: 'chart__baseline', x1: pad.left, x2: width - pad.right, y1: by, y2: by }));
    const baseLabel = svgEl('text', { class: 'chart__baseline-label', x: width - pad.right, y: by - 8, 'text-anchor': 'end' });
    baseLabel.textContent = `${formatRupees(amount)} today`;
    svg.append(baseLabel);

    // Cursor on the selected year
    const sx = x(state.year);
    svg.append(svgEl('line', { class: 'chart__cursor', x1: sx, x2: sx, y1: pad.top, y2: baseY }));

    const line = svgEl('path', { class: 'chart__line', d: linePath });
    svg.append(line);

    // Accessible point buttons
    const layer = h('div', { class: 'chart__points' });
    const selectedIndex = Math.max(0, years.indexOf(state.year));
    if (!els.canvas.contains(document.activeElement)) focusIndex = selectedIndex;

    points = data.map((d, i) => {
      const px = x(d.year);
      const py = y(d.value);
      const isToday = d.year === calc.latest.year;
      const label = isToday
        ? `${d.year}: ${formatRupees(amount)} is worth ${formatRupees(amount)} today.`
        : `${d.year}: ${formatRupees(amount)} then is worth about ${formatRupees(Math.round(d.value))} in ${calc.latest.year} rupees.`;
      const button = h('button', {
        type: 'button',
        class: 'chart__point',
        'aria-label': `${label} Select to travel to ${d.year}.`,
        style: { left: `${px}px`, top: `${py}px` },
        tabindex: i === focusIndex ? '0' : '-1',
      });
      if (d.year === state.year) button.setAttribute('aria-current', 'true');

      button.addEventListener('focus', () => { focusIndex = i; showTooltip(i); });
      button.addEventListener('blur', () => window.setTimeout(() => {
        if (!els.canvas.contains(document.activeElement)) hideTooltip();
      }, 0));
      button.addEventListener('click', () => { showTooltip(i); onSelect(d.year); });
      button.addEventListener('keydown', (event) => {
        const keys = { ArrowRight: i + 1, ArrowUp: i + 1, ArrowLeft: i - 1, ArrowDown: i - 1, Home: 0, End: data.length - 1 };
        if (event.key in keys) {
          event.preventDefault();
          moveFocus(keys[event.key]);
        } else if (event.key === 'Escape') {
          hideTooltip();
        }
      });

      layer.append(button);
      return { ...d, x: px, y: py, button };
    });

    const hadFocus = els.canvas.contains(document.activeElement);
    els.canvas.replaceChildren(svg, layer);
    els.canvas.style.height = `${height}px`;
    if (hadFocus) {
      points[focusIndex].button.focus({ preventScroll: true });
    } else {
      hideTooltip();
    }
    animateLine();

    // Text alternative
    if (els.table) {
      els.table.replaceChildren(
        ...data.map((d) =>
          h(
            'tr',
            { class: d.year === state.year ? 'is-selected' : '' },
            h('th', { scope: 'row' }, d.year),
            h('td', {}, formatRupees(amount)),
            h('td', {}, formatRupees(Math.round(d.value))),
          ),
        ),
      );
    }
  }

  function update(nextState) {
    state = nextState;
    render();
  }

  return { init, update };
})();
