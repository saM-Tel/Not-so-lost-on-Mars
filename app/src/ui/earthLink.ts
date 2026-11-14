// WHAT:    Live "link to Earth" indicator (F16): which Mars spacecraft NASA's Deep Space Network is talking to right now,
//          and how long a message takes to reach Earth, from NASA's DSN Now feed.
// IN:      https://eyes.nasa.gov/dsn/data/dsn.xml, read from the browser (the feed allows it), refreshed every 2 minutes.
// OUT:     A small line on the map, labelled live, with its source; "no data" when the feed does not answer.
// USED BY: src/main.ts.
// RULES:   Live means live: no saved copy is shown as if it were current. Light time is the feed's own round-trip time.
// TRAPS:   PITFALLS 8.
// OWNER:   Role B.

const FEED = 'https://eyes.nasa.gov/dsn/data/dsn.xml';
const PAGE = 'https://eyes.nasa.gov/apps/dsn-now/';
const REFRESH_MS = 2 * 60 * 1000;

/** DSN codes of spacecraft at Mars, with plain names. A code not listed here is not counted as a Mars link. */
const MARS_CRAFT: Record<string, string> = {
  MRO: 'Mars Reconnaissance Orbiter',
  M01O: 'Mars Odyssey',
  MVN: 'MAVEN',
  MEX: 'Mars Express (ESA)',
  TGO: 'Trace Gas Orbiter (ESA)',
  EMM: 'Hope (UAE)',
  M20: 'Perseverance',
  MSL: 'Curiosity',
};

export interface EarthLink {
  /** Mars spacecraft with an active signal to or from a DSN dish now. */
  active: string[];
  /** One-way light time Earth to Mars, seconds, from the feed's round-trip time; null if not given. */
  oneWayS: number | null;
  readUtc: string;
}

export function parseDsn(xml: string, readUtc: string): EarthLink {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const active = new Set<string>();
  for (const signal of Array.from(doc.querySelectorAll('downSignal, upSignal'))) {
    const code = signal.getAttribute('spacecraft') ?? '';
    if (signal.getAttribute('active') === 'true' && MARS_CRAFT[code]) active.add(code);
  }
  let oneWayS: number | null = null;
  for (const target of Array.from(doc.querySelectorAll('target'))) {
    const code = target.getAttribute('name') ?? '';
    const rtlt = Number(target.getAttribute('rtlt'));
    if (MARS_CRAFT[code] && rtlt > 0) { oneWayS = rtlt / 2; break; }
  }
  return { active: [...active].map((code) => MARS_CRAFT[code]!), oneWayS, readUtc };
}

export function addEarthLink(parent: HTMLElement): () => void {
  const box = document.createElement('aside');
  box.className = 'earth-link';
  box.setAttribute('aria-label', 'Link to Earth');
  box.textContent = 'Link to Earth: reading NASA\'s Deep Space Network…';
  parent.append(box);

  const read = async (): Promise<void> => {
    try {
      const response = await fetch(FEED, { cache: 'no-store' });
      if (!response.ok) throw new Error(String(response.status));
      const link = parseDsn(await response.text(), new Date().toISOString());
      const time = link.oneWayS !== null ? ` A message takes ${Math.round(link.oneWayS / 60)} min each way.` : '';
      const who = link.active.length > 0
        ? `Earth is talking to ${link.active.join(', ')} now.`
        : 'No Mars spacecraft is in contact with Earth right now.';
      box.replaceChildren(`Link to Earth (live, ${link.readUtc.slice(11, 16)} UTC): ${who}${time} `);
      const source = document.createElement('a');
      source.href = PAGE;
      source.target = '_blank';
      source.rel = 'noopener';
      source.textContent = 'NASA DSN Now';
      box.append(source);
      box.classList.toggle('earth-link--none', link.active.length === 0);
    } catch {
      box.textContent = 'Link to Earth: no data. NASA\'s Deep Space Network feed did not answer.';
      box.classList.add('earth-link--none');
    }
  };
  void read();
  const timer = window.setInterval(() => void read(), REFRESH_MS);
  return () => { window.clearInterval(timer); box.remove(); };
}
