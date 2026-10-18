/*
 * calculator.js: pure calculation functions. No DOM in here.
 *
 *   quantity = amount ÷ price × perUnits
 *     e.g. ₹500 ÷ ₹6 per dosa        ≈ 83 dosas
 *          ₹500 ÷ ₹4,650 per 10 g × 10 ≈ 1.08 g of gold
 *
 *   worth in today's money = amount × CPI(latest year) ÷ CPI(chosen year)
 */
window.RTM = window.RTM || {};

window.RTM.calc = (() => {
  const { DATA } = window.RTM;
  const { formatNumber } = window.RTM.utils;

  const years = [...DATA.years].sort((a, b) => a.year - b.year);
  const yearList = years.map((entry) => entry.year);
  const latest = years[years.length - 1];

  const getYear = (year) => years.find((entry) => entry.year === year) || latest;
  const getItem = (id) => DATA.items[id];
  const nearestYear = (year) =>
    yearList.reduce((best, y) => (Math.abs(y - year) < Math.abs(best - year) ? y : best), yearList[0]);

  /** Formats a quantity using the item's own rules (whole dosas, 2-dp grams, MB for tiny data). */
  function describeQuantity(item, rawQuantity) {
    let value = rawQuantity;
    let decimals = item.decimals;
    let unit = item.shortUnit || null;
    let singular = item.unit;
    let plural = item.units;

    if (item.smallUnit && rawQuantity < 1) {
      value = rawQuantity * item.smallUnit.factor;
      decimals = item.smallUnit.decimals;
      unit = item.smallUnit.unit;
      singular = unit;
      plural = unit;
    }

    if (decimals === 0) {
      // Countable things: you can only buy whole ones.
      value = value >= 1 ? Math.floor(value) : value;
      if (value < 1) decimals = 1;
    }

    const rounded = Number(value.toFixed(decimals));
    const numberText = formatNumber(rounded, decimals);
    const word = rounded === 1 ? singular : plural;

    return {
      value: rounded,
      decimals,
      numberText,
      unitWord: word,
      unitShort: unit || word,
      text: `${numberText} ${word}`,
    };
  }

  /** What `amount` buys of one item in one year. */
  function quantityOf(itemId, amount, year) {
    const item = getItem(itemId);
    const price = getYear(year).prices[itemId];

    if (price === null || price === undefined) {
      return { itemId, item, year, available: false, price: null };
    }

    const raw = (amount / price) * item.perUnits;
    return {
      itemId,
      item,
      year,
      available: true,
      price,
      raw,
      ...describeQuantity(item, raw),
    };
  }

  /** How many times more of an item `amount` bought in `year` than in the latest year. */
  function timesMore(itemId, year) {
    const then = getYear(year).prices[itemId];
    const now = latest.prices[itemId];
    if (!then || !now) return null;
    return now / then;
  }

  /** ₹amount in `year` expressed in the latest year's money (CPI-based). */
  function inTodaysMoney(amount, year) {
    return (amount * latest.cpi) / getYear(year).cpi;
  }

  return {
    years,
    yearList,
    latest,
    getYear,
    getItem,
    nearestYear,
    quantityOf,
    describeQuantity,
    timesMore,
    inTodaysMoney,
  };
})();
