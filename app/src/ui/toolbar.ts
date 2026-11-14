// WHAT:    One bar at the top right of the map for the app's own controls (the display switch and "Install app"), beside
//          MapLibre's zoom buttons, so they line up instead of each floating at its own position (F17).
// IN:      Nothing.
// OUT:     The bar element, made once and shared.
// USED BY: src/ui/modes.ts, src/ui/install.ts.
// RULES:   Controls keep their own styles; the bar only places them. It wraps on narrow screens.
// TRAPS:   PITFALLS 11.
// OWNER:   Role B.

/** The shared bar, made on first use. */
export function mapToolbar(): HTMLElement {
  let bar = document.querySelector<HTMLElement>('.map-toolbar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'map-toolbar';
    document.body.append(bar);
  }
  return bar;
}
