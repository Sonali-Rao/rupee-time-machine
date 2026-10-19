/*
 * Main result: three "ticket" cards (dosa, petrol, gold by default).
 * Numbers count up from their previous value; cards get a stamp animation
 * when the time machine fires.
 */
window.RTM = window.RTM || {};

window.RTM.results = (() => {
  const { DATA, calc, utils } = window.RTM;
  const { h, icon, formatRupees, formatNumber, animateValue, replayAnimation } = utils;

  let container;
  const previous = new Map();   // itemId → last displayed raw number

  function init() {
    container = document.querySelector('[data-result-cards]');
  }

  /** "At approximately ₹6 per plate, ₹500 could buy around 83 dosas." */
  function explanation(result, amount) {
    const { item, price } = result;
    const priceText = `${formatRupees(price)} per ${item.priceUnit}`;
    if (result.itemId === 'gold') {
      return `At approximately ${priceText}, ${formatRupees(amount)} represented around ${result.numberText} g of gold.`;
    }
    return `At approximately ${priceText}, ${formatRupees(amount)} could buy around ${result.text}.`;
  }

  function card(result, amount, state, index) {
    const { item } = result;
    const number = h('span', { class: 'result-card__number' }, result.available ? result.numberText : '—');

    const article = h(
      'article',
      { class: `result-card${result.available ? '' : ' result-card--unavailable'}`, style: { '--i': index } },
      h(
        'div',
        { class: 'result-card__stub', 'aria-hidden': 'true' },
        h('span', {}, `Issued ${state.year}`),
        h('span', {}, `Value ${formatRupees(amount)}`),
        h('span', {}, `No. ${String(index + 1).padStart(3, '0')}`),
      ),
      h('div', { class: 'result-card__art' }, icon(item.icon, 'icon')),
      h(
        'div',
        { class: 'result-card__body' },
        h('h3', { class: 'result-card__name' }, item.label),
        result.available
          ? [
              h('p', { class: 'result-card__price' }, h('strong', {}, formatRupees(result.price)), ` / ${item.priceUnit}`),
              h('span', { class: 'tag' }, 'Approximate historical price'),
              h('p', { class: 'result-card__qty' }, number, h('span', { class: 'result-card__unit' }, result.unitWord)),
              h('p', { class: 'result-card__explain' }, explanation(result, amount)),
            ]
          : [
              h('span', { class: 'tag' }, 'No data for this year'),
              h('p', { class: 'result-card__qty' }, number),
              h('p', { class: 'result-card__explain' }, item.unavailableText || 'There is no price for this item in the dataset for this year.'),
            ],
      ),
    );

    if (result.available) {
      const from = previous.get(result.itemId);
      const decimals = result.decimals;
      animateValue(number, from, result.value, (v) => formatNumber(decimals === 0 ? Math.floor(v) : v, decimals));
      previous.set(result.itemId, result.value);
    }
    return article;
  }

  function update(state, { stamp = false } = {}) {
    if (!container) return;
    const cards = DATA.featured.map((id, index) =>
      card(calc.quantityOf(id, state.amount, state.year), state.amount, state, index),
    );
    container.replaceChildren(...cards);
    if (stamp) cards.forEach((el) => replayAnimation(el, 'is-stamping'));
  }

  return { init, update };
})();
