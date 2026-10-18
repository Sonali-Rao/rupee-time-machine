/*
 * utils.js: small, generic helpers (formatting, animation, DOM).
 * Nothing in here knows about rupees or years.
 */
window.RTM = window.RTM || {};

window.RTM.utils = (() => {
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const INDIAN_LOCALE = 'en-IN';

  /** true when the visitor has asked the OS for less motion. */
  const prefersReducedMotion = () => reducedMotionQuery.matches;

  /** 1234567 → "12,34,567" (Indian digit grouping). */
  function formatNumber(value, decimals = 0) {
    return Number(value).toLocaleString(INDIAN_LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /** 1234567 → "₹12,34,567". Small amounts keep up to 2 decimals. */
  function formatRupees(value) {
    const decimals = value < 100 && !Number.isInteger(value) ? 2 : 0;
    return `₹${formatNumber(value, decimals)}`;
  }

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function debounce(fn, wait) {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), wait);
    };
  }

  /**
   * Counts an element's text from one number to another.
   * Falls back to an instant update when reduced motion is on.
   */
  function animateValue(element, from, to, format, duration = 700) {
    if (!element) return;
    if (element._rtmFrame) cancelAnimationFrame(element._rtmFrame);

    if (prefersReducedMotion() || from === to || !Number.isFinite(from)) {
      element.textContent = format(to);
      return;
    }

    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      element.textContent = format(from + (to - from) * eased);
      if (t < 1) element._rtmFrame = requestAnimationFrame(step);
    };
    element._rtmFrame = requestAnimationFrame(step);
  }

  /** Restarts a one-shot CSS animation class on an element. */
  function replayAnimation(element, className) {
    if (!element || prefersReducedMotion()) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
  }

  /**
   * Tiny DOM builder. Text is always set with textContent, never parsed as HTML.
   *   h('p', { class: 'note' }, 'Hello')
   */
  function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === false || value === null || value === undefined) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'style' && typeof value === 'object') {
        // setProperty is required for custom properties (--i, --fraction…)
        Object.entries(value).forEach(([prop, v]) => node.style.setProperty(prop, String(v)));
      }
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    });
    children.flat().forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  /** <svg><use href="#id"></svg>, decorative by default. */
  function icon(id, className = 'icon') {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', `#${id}`);
    svg.append(use);
    return svg;
  }

  return {
    prefersReducedMotion,
    reducedMotionQuery,
    formatNumber,
    formatRupees,
    clamp,
    debounce,
    animateValue,
    replayAnimation,
    h,
    icon,
  };
})();
