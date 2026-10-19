/*
 * ============================================================================
 *  data.js: the ONLY place historical prices live.
 * ============================================================================
 *
 *  ⚠️  SAMPLE / DEMO DATA
 *  Every price below is a rounded, approximate figure chosen to illustrate the
 *  idea. None of them has been verified against an official source. Replace
 *  them with properly sourced values (and fill in `sources`) before presenting
 *  this project as a factual historical dataset.
 *
 *  HOW TO EDIT
 *  - Change a price: edit the number in `years[].prices`.
 *  - Add a year (e.g. 1985): add another object to `years`. Order doesn't
 *    matter; the app sorts by year. Use `null` for anything that didn't exist
 *    or that you have no data for.
 *  - Add an item: add a definition to `items`, a price for it in every year,
 *    then list its id in `featured`, `extras` or `compare` below.
 *  - Mark a verified value: set `dataStatus` to "sourced" and list your
 *    sources in `sources` (shown on the page automatically).
 * ============================================================================
 */
window.RTM = window.RTM || {};

window.RTM.DATA = {
  meta: {
    title: 'Rupee Time Machine dataset',
    currency: 'INR',
    /* "sample" shows a clear "Sample data" warning across the site.
       Switch to "sourced" only once every value is backed by a source below. */
    dataStatus: 'sample',
    lastReviewed: '2026-09',
    /* Add real references here, e.g.
       { label: 'Petroleum Planning & Analysis Cell: historical retail prices', url: 'https://…' } */
    sources: [],
  },

  /* The amount the visitor sees first, and the year selected on first load. */
  defaults: {
    amount: 500,
    year: 1995,
  },

  /* Which items appear where. */
  featured: ['dosa', 'petrol', 'gold'],
  compare: ['dosa', 'petrol', 'gold'],
  extras: ['cinema', 'bus', 'coffee', 'rice', 'lpg', 'data'],

  /*
   * Item definitions.
   *  priceUnit   – what one price buys, shown as "₹10 / plate"
   *  perUnits    – how many quantity-units the price covers (gold is priced per 10 g)
   *  unit/units  – how the resulting quantity is described
   *  decimals    – 0 for things you count, more for things you measure
   *  smallUnit   – optional: show tiny quantities in a smaller unit (1 GB → MB)
   *  icon        – id of an SVG <symbol> in index.html
   */
  items: {
    dosa: {
      label: 'Dosa',
      description: 'Plain dosa at a simple local eatery',
      priceUnit: 'plate',
      perUnits: 1,
      unit: 'dosa',
      units: 'dosas',
      decimals: 0,
      icon: 'i-dosa',
    },
    petrol: {
      label: 'Petrol',
      description: 'Retail petrol, per litre (metro city)',
      priceUnit: 'litre',
      perUnits: 1,
      unit: 'litre',
      units: 'litres',
      shortUnit: 'L',
      decimals: 1,
      icon: 'i-petrol',
    },
    gold: {
      label: 'Gold',
      description: '24-carat gold, priced per 10 grams',
      priceUnit: '10g',
      perUnits: 10,
      unit: 'gram',
      units: 'grams',
      shortUnit: 'g',
      decimals: 2,
      icon: 'i-gold',
    },
    cinema: {
      label: 'Movie ticket',
      description: 'Single-screen cinema ticket',
      priceUnit: 'ticket',
      perUnits: 1,
      unit: 'ticket',
      units: 'tickets',
      decimals: 0,
      icon: 'i-cinema',
    },
    bus: {
      label: 'City bus ride',
      description: 'Short ordinary city-bus journey',
      priceUnit: 'ride',
      perUnits: 1,
      unit: 'ride',
      units: 'rides',
      decimals: 0,
      icon: 'i-bus',
    },
    coffee: {
      label: 'Filter coffee',
      description: 'One tumbler at a local café',
      priceUnit: 'cup',
      perUnits: 1,
      unit: 'cup',
      units: 'cups',
      decimals: 0,
      icon: 'i-coffee',
    },
    rice: {
      label: 'Rice',
      description: 'Ordinary rice, per kilogram',
      priceUnit: 'kg',
      perUnits: 1,
      unit: 'kg',
      units: 'kg',
      shortUnit: 'kg',
      decimals: 1,
      icon: 'i-rice',
    },
    lpg: {
      label: 'LPG cylinder',
      description: 'Domestic 14.2 kg cooking-gas refill',
      priceUnit: 'cylinder',
      perUnits: 1,
      unit: 'cylinder',
      units: 'cylinders',
      decimals: 1,
      icon: 'i-lpg',
    },
    data: {
      label: 'Mobile data',
      description: 'Typical cost of 1 GB of mobile data',
      priceUnit: 'GB',
      perUnits: 1,
      unit: 'GB',
      units: 'GB',
      shortUnit: 'GB',
      decimals: 1,
      smallUnit: { factor: 1000, unit: 'MB', decimals: 0 },
      icon: 'i-data',
      unavailableText: 'Mobile data wasn’t a consumer thing yet',
    },
  },

  /*
   * Year-by-year prices in ₹.  ⚠️ SAMPLE VALUES, rounded approximations.
   *
   * `cpi` is a simple consumer-price index scaled so the latest year = 100.
   * It powers the "worth in today's money" chart. Also sample: replace it
   * with an official CPI series (rescaled so your latest year = 100).
   */
  years: [
    { year: 1990, cpi: 9,  prices: { dosa: 3,  petrol: 9,   gold: 3200,   cinema: 8,   bus: 1,  coffee: 1,  rice: 4,  lpg: 57,  data: null } },
    { year: 1995, cpi: 15, prices: { dosa: 6,  petrol: 21,  gold: 4650,   cinema: 15,  bus: 2,  coffee: 2,  rice: 7,  lpg: 110, data: null } },
    { year: 2000, cpi: 21, prices: { dosa: 10, petrol: 28,  gold: 4400,   cinema: 30,  bus: 3,  coffee: 3,  rice: 11, lpg: 230, data: null } },
    { year: 2005, cpi: 26, prices: { dosa: 15, petrol: 40,  gold: 7000,   cinema: 60,  bus: 4,  coffee: 5,  rice: 13, lpg: 295, data: 10000 } },
    { year: 2010, cpi: 38, prices: { dosa: 25, petrol: 52,  gold: 18500,  cinema: 100, bus: 5,  coffee: 8,  rice: 25, lpg: 345, data: 250 } },
    { year: 2015, cpi: 57, prices: { dosa: 40, petrol: 66,  gold: 26300,  cinema: 150, bus: 8,  coffee: 12, rice: 32, lpg: 420, data: 250 } },
    { year: 2020, cpi: 73, prices: { dosa: 50, petrol: 80,  gold: 48600,  cinema: 180, bus: 10, coffee: 15, rice: 38, lpg: 700, data: 10 } },
    { year: 2026, cpi: 100, prices: { dosa: 70, petrol: 102, gold: 130000, cinema: 250, bus: 15, coffee: 25, rice: 50, lpg: 870, data: 12 } },
  ],
};
