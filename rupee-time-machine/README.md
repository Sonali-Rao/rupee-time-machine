# ₹ Rupee Time Machine

**What did ₹500 used to buy?**

An interactive exhibit that makes Indian inflation visual. Enter an amount, pick a year, and see what that money would have bought back then: plates of dosa, litres of petrol, grams of gold, movie tickets, bus rides and more.

> ⚠️ **Read this before sharing the project.** Every price in this repository is **sample / demo data**: rounded, approximate figures chosen to illustrate the idea. None of them has been checked against official records. Replace the dataset with properly sourced values (see [Replacing the prices](#replacing-the-prices)) before presenting it as factual history.

---

## Concept

The same ₹500 note never changes, but what it can buy does. This project turns that abstract idea into something you can see and play with:

- It asks one question: *"What did my ₹500 used to mean?"*
- It answers in everyday items people remember, like dosas, petrol and gold.
- It is designed like a railway ticket crossed with an old banknote, with a bit of museum exhibit and data visualisation mixed in.

It is an **educational experience, not a financial calculator.**

---

## Features

| Section | What it does |
|---|---|
| **Time machine** (hero) | Ticket-style form: amount input with quick-amount "notes" (₹100 / ₹500 / ₹1,000 / ₹2,000), a draggable timeline slider (1990 ── … ── 2026), **Take me back →** and **Surprise me** |
| **Your ₹500 in 1995** | Three large result "tickets" (dosa, petrol, gold). Each shows the approximate price, a count-up number and a plain-English explanation |
| **₹500 never changed** | Then vs. today as icon grids on a shared scale. Dashed circles show what today's money can no longer buy. You can switch between dosa, petrol and gold |
| **Travel through time** | One ticket per year in a horizontal strip. Select a ticket to jump to that year, or press **Play the journey** (pause at any time) |
| **What else could it buy?** | Six small cards: movie ticket, bus ride, filter coffee, rice, LPG cylinder, mobile data |
| **Why does ₹500 feel smaller?** | Inflation explained in three sentences, plus an animation (same note → fewer dosas) and a twist from the data: some things, like mobile data, got cheaper |
| **Watch your ₹500 travel through time** | A dependency-free SVG chart of what the amount is worth in today's money. It works with hover, tap and keyboard, and has a data-table alternative |
| **Where do these numbers come from?** | Why historical prices are approximate, a sources list, and the full dataset table generated from `data.js` |
| **Share my result** | Uses the Web Share API, then the clipboard, then a selectable text box as fallbacks. Links include `?amount=…&year=…` so they reopen the same result |

Other details:

- The URL stays in sync with the current state, so any view can be bookmarked.
- The page updates as you type or drag.
- There are no dependencies and no build step.

---

## Technologies

- **HTML5**: semantic sections, native form controls (`<input type="range">`, radio groups, `<details>`), inline SVG illustrations
- **CSS3**: custom properties, Grid, Flexbox, `clamp()` type scale, gradients for textures (banknote rings, ticket stripes, SVG grain), `clip-path`, keyframe animations, `prefers-reduced-motion`, `forced-colors`
- **Vanilla JavaScript (ES2020)**: small classic scripts sharing one `window.RTM` namespace. That means no modules, so the project also works when opened directly from the file system.

No React, no frameworks, no chart library, no backend, no API keys.

---

## How the calculator works

All the maths is in `js/calculator.js`. It only does calculations and never touches the page.

```
quantity            = amount ÷ price × perUnits
worth in today's ₹  = amount × CPI(latest year) ÷ CPI(chosen year)
```

- **Dosa** at ₹6: ₹500 ÷ 6 = 83.3, rounded down to **83 dosas**. Countable items are always rounded down, because you can't buy a third of a dosa.
- **Gold** at ₹4,650 per 10 g: ₹500 ÷ 4,650 × 10 = **1.08 g**. Gold uses `perUnits: 10` because it is priced per 10 grams.
- **Mobile data** at ₹10,000 per GB: ₹500 buys 0.05 GB, which is shown as **50 MB** (the item has a `smallUnit`).
- **Today's money**: with CPI 15 in 1995 and 100 in 2026, ₹500 then ≈ ₹500 × 100 ÷ 15 ≈ **₹3,333** today.

If a price is `null` (for example, mobile data in 1990), the site says the item wasn't available instead of dividing by zero.

---

## Data structure

Everything lives in **`js/data.js`**:

```js
window.RTM.DATA = {
  meta: {
    dataStatus: 'sample',      // 'sample' shows warnings everywhere; 'sourced' removes them
    sources: [],               // [{ label, url }] – listed automatically on the page
  },
  defaults: { amount: 500, year: 1995 },

  featured: ['dosa', 'petrol', 'gold'],                       // the three big result cards
  compare:  ['dosa', 'petrol', 'gold'],                       // "then vs today" switcher
  extras:   ['cinema', 'bus', 'coffee', 'rice', 'lpg', 'data'],  // small cards

  items: {
    gold: {
      label: 'Gold', priceUnit: '10g', perUnits: 10,
      unit: 'gram', units: 'grams', shortUnit: 'g',
      decimals: 2, icon: 'i-gold',
    },
    // …
  },

  years: [
    { year: 1995, cpi: 15, prices: { dosa: 6, petrol: 21, gold: 4650, /* … */ data: null } },
    // …
  ],
};
```

Nothing else in the project contains a price. The HTML, the slider ticks, the journey tickets, the chart, the tables and the share text are all generated from this file.

---

## Adding historical years

Add one object to `years` in `js/data.js`:

```js
{ year: 1985, cpi: 5, prices: { dosa: 1.5, petrol: 7, gold: 2100, cinema: 4, bus: 0.5, coffee: 0.5, rice: 2.5, lpg: 45, data: null } },
```

- The order doesn't matter; the app sorts by year.
- The slider, ticks, journey, chart and tables all pick up the new year automatically.
- Uneven gaps (1985 → 1990 → 2026) are fine. The slider moves between entries, and the chart places points by actual year.
- Use `null` for anything that didn't exist or that you have no data for.
- The **latest** year in the list is treated as "today".

## Adding an item

1. Add a definition under `items`. Copy an existing one and change `label`, `priceUnit`, `unit`/`units`, `decimals` and `icon`.
2. Add a price for it to every year (or `null`).
3. List its id in `featured`, `compare` or `extras`.
4. For a new illustration, add an SVG `<symbol id="i-yourthing" viewBox="0 0 64 64">` to the sprite at the top of `index.html`.

## Replacing the prices

1. Choose one consistent source per item where possible. Examples of the kind of source to look for:
   - official fuel price histories
   - published gold price series
   - India's official consumer price index (CPI)
   - dated menu cards or newspaper archives for dosa and coffee prices
2. Be consistent about **city, month and product quality**, and write those choices down.
3. Update the numbers in `years[].prices`.
4. Add every reference to `meta.sources` as `{ label, url }`. They appear in the "Where do these numbers come from?" section.
5. Replace the sample `cpi` column with a real CPI series, rescaled so your latest year = 100.
6. Only when **every** value is sourced, set `meta.dataStatus` to `'sourced'`. That removes the sample-data warnings.

Until then, keep describing the project as using illustrative sample data.

---

## Running locally

### Option 1: open the file
Extract the ZIP and double-click `index.html`. It works directly from the file system; no server is needed.

### Option 2: VS Code + Live Server (recommended)
1. Extract `rupee-time-machine.zip`.
2. In VS Code choose **File → Open Folder…** and select the `rupee-time-machine` folder.
3. Install the recommended **Live Server** extension when prompted (or search for "Live Server" by Ritwick Dey).
4. Right-click `index.html` and choose **Open with Live Server**, or click **Go Live** in the status bar.
5. The site opens at `http://127.0.0.1:5500/` and reloads whenever you save.

Try `http://127.0.0.1:5500/?amount=2000&year=1990`.

---

## Project structure

```
rupee-time-machine/
├── index.html                 # Page structure + inline SVG illustration sprite
├── README.md
├── .gitignore
├── .vscode/extensions.json    # Recommends Live Server
├── css/
│   ├── base.css               # Tokens (colours, type, spacing), reset, utilities
│   ├── components.css         # Buttons, chips, fields, year slider, tickets, tables
│   ├── sections.css           # Each page section, top to bottom
│   └── responsive.css         # Breakpoints, reduced motion, forced colours
├── js/
│   ├── data.js                # ⭐ The dataset: the only file with prices
│   ├── utils.js               # Formatting (Indian digit grouping), animation, DOM helper
│   ├── calculator.js          # Pure maths: quantities, ratios, today's-money value
│   ├── app.js                 # State + wiring (amount, year, compare item)
│   └── components/
│       ├── year-slider.js     # Timeline slider + ticks
│       ├── results.js         # The three result tickets
│       ├── compare.js         # Then vs today icon grids
│       ├── journey.js         # Year-by-year ticket strip + autoplay
│       ├── extras.js          # "What else could it buy?"
│       ├── explainer.js       # Inflation animation + "cheaper" twist
│       ├── chart.js           # SVG chart with accessible points
│       ├── data-table.js      # Dataset table, sources, sample notice
│       └── share.js           # Web Share / clipboard / fallback
└── assets/
    └── icons/favicon.svg
```

Scripts load with `defer` in dependency order: data → utils → calculator → components → app.

---

## Accessibility (WCAG 2.2 AA)

The design looks vintage; the code does not.

- **Semantic structure**: landmarks, one `h1`, headings in order, lists and tables used for their real purpose, and a skip link.
- **Contrast**: every text colour pair meets AA (4.5:1, or 3:1 for large text). Pairs are documented in `css/base.css`. Gold is used as a text colour only in its darker `--gold-text` variant on light backgrounds, or as `--gold-bright` on dark green. Form-control borders meet 3:1 (WCAG 1.4.11). Checked with axe-core, plus a custom script for text on textured backgrounds.
- **Year selector**: a native range slider. You can drag it, tap it, or use the arrow keys, Home and End. It announces the year (`aria-valuetext`) rather than an index, and the tick labels are an extra shortcut for pointer users.
- **Form**: real labels, a hint and an error linked with `aria-describedby`, `aria-invalid`, and clear error messages. Quick-amount chips use `aria-pressed`.
- **Live results for screen readers**: a debounced polite status region reads a one-sentence summary after each change, so dragging the slider doesn't flood the reader. After **Take me back**, focus moves to the result heading.
- **Chart**: the SVG is decorative. The points are real buttons with descriptive labels, using a roving tabindex (Tab in, arrow keys to move, Enter to travel to that year). The tooltip appears on focus as well as hover, and a data table is provided as a text alternative.
- **No hover-only information**: every tooltip, lift or highlight also responds to focus or tap.
- **Motion**: with `prefers-reduced-motion`, all animations, count-ups, the page wash and smooth scrolling are turned off, and updates happen instantly. Autoplay ("Play the journey") only starts when you ask, and can be paused.
- **Targets**: interactive controls are at least 40–48 px (WCAG 2.5.8 requires 24 px).
- **Decorative art is hidden** from assistive tech. Meaningful icons always come with visible text.
- **Scrollable regions** (the wide tables) are keyboard-focusable and labelled.
- **Forced colours / Windows High Contrast**: selected states stay visible.

---

## Responsive behaviour

- **Desktop**: two-column hero (headline + ticket), three result cards, side-by-side then/today.
- **Tablet (≤ 1000px)**: hero stacks, two cards per row.
- **Mobile (≤ 720px)**: cards stack, full-width buttons, then/today stack with "vs" between them. The journey strip and wide tables scroll sideways inside their own container, so the page itself never scrolls horizontally.
- **Small phones (≤ 420px)**: every other year label on the slider is hidden (the selected year always shows), and the illustrations get more compact.
- The type scale uses `clamp()`, so headings grow and shrink smoothly with the screen.

---

## Future improvements

- Replace the sample dataset with **sourced, city-specific prices** (and let users pick a city)
- Use an **official CPI series** for the "today's money" chart
- Add more years (1980, 1985) and more items (train ticket, postcard, school fees)
- A **"your birth year"** mode
- Generate a **downloadable share image** of your ticket with `<canvas>`
- Hindi / regional-language versions
- Automated accessibility and visual tests (axe + Playwright) in CI

---

*Built with HTML, CSS and vanilla JavaScript. This is not financial advice, and the prices are illustrative sample data.*
