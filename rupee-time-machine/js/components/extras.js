/*
 * "What else could ₹500 buy?": small cards for the items listed in DATA.extras.
 */
window.RTM = window.RTM || {};

window.RTM.extras = (() => {
  const { DATA, calc, utils } = window.RTM;
  const { h, icon, formatRupees, replayAnimation } = utils;

  let list;

  function init() {
    list = document.querySelector('[data-extras]');
  }

  function card(result, index) {
    const { item } = result;
    const unavailable = !result.available;
    return h(
      'li',
      {
        class: `extra-card${unavailable ? ' extra-card--unavailable' : ''}`,
        style: { '--i': index },
      },
      icon(item.icon),
      h('h3', { class: 'extra-card__name' }, item.label),
      h('p', { class: 'extra-card__qty' }, unavailable ? item.unavailableText || 'No data for this year' : result.text),
      h(
        'p',
        { class: 'extra-card__price' },
        unavailable ? item.description : `≈ ${formatRupees(result.price)} / ${item.priceUnit}`,
      ),
    );
  }

  function update(state, { stamp = false } = {}) {
    if (!list) return;
    const cards = DATA.extras.map((id, index) => card(calc.quantityOf(id, state.amount, state.year), index));
    list.replaceChildren(...cards);
    if (stamp) cards.forEach((el) => replayAnimation(el, 'is-stamping'));
  }

  return { init, update };
})();
