/*
 * Year slider: a native <input type="range"> over the list of dataset years.
 * The range works in "stops" (0…n-1) so uneven gaps (2020 → 2026) are fine.
 * Keyboard, touch, drag and screen readers all work natively; the tick
 * labels are an extra click target for pointer users.
 */
window.RTM = window.RTM || {};

window.RTM.yearSlider = (() => {
  const { yearList } = window.RTM.calc;
  let input;
  let ticks = [];
  let slider;

  function init({ onChange }) {
    slider = document.querySelector('[data-year-slider]');
    input = document.getElementById('year');
    const tickList = document.querySelector('[data-year-ticks]');
    if (!slider || !input || !tickList) return;

    input.min = '0';
    input.max = String(yearList.length - 1);
    input.step = '1';

    ticks = yearList.map((year, index) => {
      const tick = document.createElement('li');
      tick.className = 'year-slider__tick';
      tick.style.setProperty('--pos', yearList.length > 1 ? index / (yearList.length - 1) : 0);
      const label = document.createElement('span');
      label.className = 'year-slider__label';
      label.textContent = year;
      tick.append(label);
      // Pointer shortcut; keyboard users use the slider itself.
      tick.addEventListener('click', () => {
        onChange(year);
        input.focus({ preventScroll: true });
      });
      tickList.append(tick);
      return tick;
    });

    input.addEventListener('input', () => onChange(yearList[Number(input.value)]));
  }

  function update(state) {
    if (!input) return;
    const index = Math.max(0, yearList.indexOf(state.year));
    input.value = String(index);
    input.setAttribute('aria-valuetext', String(state.year));
    const fill = yearList.length > 1 ? (index / (yearList.length - 1)) * 100 : 0;
    slider.style.setProperty('--fill', `${fill}%`);

    ticks.forEach((tick, i) => {
      tick.classList.toggle('is-active', i === index);
      tick.classList.toggle('is-past', i <= index);
    });
  }

  return { init, update };
})();
