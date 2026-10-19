/*
 * "Travel through time": one ticket per dataset year, in a horizontal strip.
 * Selecting a ticket jumps the whole page to that year. "Play the journey"
 * steps through every year automatically and can be paused at any time.
 */
window.RTM = window.RTM || {};

window.RTM.journey = (() => {
  const { DATA, calc, utils } = window.RTM;
  const { h, icon, formatRupees, prefersReducedMotion } = utils;

  const STEP_MS = 1600;
  let els = {};
  let buttons = new Map();
  let onSelect = () => {};
  let timer = 0;
  let playing = false;
  let currentYear = null;

  function init(options) {
    onSelect = options.onSelect;
    els = {
      track: document.querySelector('[data-journey-track]'),
      scroller: document.querySelector('[data-journey-scroller]'),
      play: document.querySelector('[data-journey-play]'),
      playLabel: document.querySelector('[data-journey-play-label]'),
    };
    if (!els.track) return;

    calc.yearList.forEach((year) => {
      const button = h('button', { type: 'button', class: 'journey-stop' });
      button.addEventListener('click', () => {
        stop();
        onSelect(year);
      });
      buttons.set(year, button);
      els.track.append(h('li', { class: 'journey__item' }, button));
    });

    els.play?.addEventListener('click', () => (playing ? stop() : play()));
  }

  function renderStop(button, year, amount) {
    const lines = DATA.featured.map((id) => {
      const q = calc.quantityOf(id, amount, year);
      if (!q.available) {
        return h('li', {}, icon(q.item.icon), h('strong', {}, 'n/a'), h('span', { class: 'visually-hidden' }, ` ${q.item.label}`));
      }
      // Short visible label ("23.8 L"), full spoken label ("23.8 litres of petrol").
      const spoken = q.item.shortUnit ? `${q.text} of ${q.item.label.toLowerCase()}` : q.text;
      return h(
        'li',
        {},
        icon(q.item.icon),
        h('strong', { 'aria-hidden': 'true' }, `${q.numberText} ${q.unitShort}`),
        h('span', { class: 'visually-hidden' }, spoken),
      );
    });

    button.replaceChildren(
      h(
        'span',
        { class: 'journey-stop__head' },
        h('span', { class: 'journey-stop__year' }, year),
        h('span', { class: 'journey-stop__amount' }, formatRupees(amount)),
      ),
      h('ul', { class: 'journey-stop__list' }, lines),
      h('span', { class: 'journey-stop__here', 'aria-hidden': 'true' }, 'You are here'),
    );
  }

  function scrollToYear(year) {
    const button = buttons.get(year);
    if (!button || !els.scroller) return;
    const item = button.parentElement;
    const target = item.offsetLeft - (els.scroller.clientWidth - item.offsetWidth) / 2;
    els.scroller.scrollTo({ left: Math.max(0, target), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function update(state) {
    if (!els.track) return;
    buttons.forEach((button, year) => {
      renderStop(button, year, state.amount);
      if (year === state.year) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    if (currentYear !== state.year) scrollToYear(state.year);
    currentYear = state.year;
  }

  function setPlayingUi(isPlaying) {
    playing = isPlaying;
    if (!els.play) return;
    els.playLabel.textContent = isPlaying ? 'Pause the journey' : 'Play the journey';
    els.play.querySelector('use')?.setAttribute('href', isPlaying ? '#i-pause' : '#i-play');
  }

  function play() {
    const years = calc.yearList;
    let index = years.indexOf(currentYear);
    // Start from the beginning if we're already at the end.
    if (index < 0 || index === years.length - 1) index = -1;
    setPlayingUi(true);

    const tick = () => {
      index += 1;
      onSelect(years[index], { fromJourney: true });
      if (index >= years.length - 1) {
        stop();
        return;
      }
      timer = window.setTimeout(tick, STEP_MS);
    };
    tick();
  }

  function stop() {
    window.clearTimeout(timer);
    setPlayingUi(false);
  }

  return { init, update, stop, isPlaying: () => playing };
})();
