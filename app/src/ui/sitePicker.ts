// WHAT:    The list of sites beside the globe and the details card for a chosen site (F14).
// IN:      Site records and readiness levels from src/data/loadSites.ts.
// OUT:     Page elements; callbacks when a site is chosen, opened, or the person asks for all sites again.
// USED BY: src/main.ts.
// RULES:   Shows readiness level, available data and what the app offers there. A site that is not built says so.
// TRAPS:   PITFALLS 2, 11.
// OWNER:   Role B.

import { NOT_APPLICABLE, NOT_FOUND, type LayerRecord, type ReadinessLevel, type SiteEntry } from '../data/contract';

export interface SitePickerOptions {
  parent: HTMLElement;
  sites: SiteEntry[];
  levels: Record<string, ReadinessLevel>;
  /** Sites left out of the list because their record was incomplete, with the reasons. */
  rejected: { id: string; problems: string[] }[];
  /** Record of the whole-planet image, shown so the person knows what they are looking at. */
  image: LayerRecord;
  /** The site to mark as the place to start, if it is in the list. */
  startSiteId: string | null;
  onSelect: (siteId: string) => void;
  onShowAll: () => void;
  onOpen: (siteId: string) => void;
}

export interface SitePicker {
  /** Show one site's details, or the list of all sites when null. */
  show(siteId: string | null): void;
  /** An empty place in a site's details, just under its name, for that site's own tools such as the layer panel. */
  slot: HTMLElement;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function sourceLink(label: string, url: string): HTMLElement {
  if (!/^https?:\/\//.test(url)) return el('span', 'source', label);
  const link = el('a', 'source', label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

function degrees(value: number, positive: string, negative: string): string {
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`;
}

/** Position in plain words, in the app's convention: east-positive longitude, planetocentric latitude. */
export function formatPosition(site: SiteEntry): string {
  return `${degrees(site.latDeg, 'N', 'S')}, ${degrees(site.lonEastDeg, 'E', 'W')}`;
}

function levelBadge(site: SiteEntry, levels: Record<string, ReadinessLevel>): HTMLElement {
  const badge = el('span', `level-badge level-${site.level}`, `Level ${site.level}: ${levels[String(site.level)]?.name ?? ''}`);
  return badge;
}

function section(title: string, ...children: (HTMLElement | string)[]): HTMLElement {
  const box = el('section', 'card__section');
  box.append(el('h3', undefined, title), ...children);
  return box;
}

function list(items: string[]): HTMLElement {
  const ul = el('ul');
  for (const item of items) ul.append(el('li', undefined, item));
  return ul;
}

export function createSitePicker(options: SitePickerOptions): SitePicker {
  const { parent, sites, levels, rejected, image, startSiteId, onSelect, onShowAll, onOpen } = options;
  const panel = el('aside', 'panel');
  panel.setAttribute('aria-label', 'Landing sites');

  const header = el('header', 'panel__header');
  header.append(
    el('h1', undefined, 'Tether'),
    el('p', 'panel__line', 'Plan a walk on Mars and know you can get home. Pick a landing site to begin.'),
  );
  const body = el('div', 'panel__body');
  panel.append(header, body);
  parent.append(panel);

  const slot = el('div', 'panel__slot');

  function showList(): void {
    body.replaceChildren();
    body.append(el('h2', undefined, 'NASA landing sites'));
    const ul = el('ul', 'site-list');
    // Sites the app can open come first, then by readiness level, then by name.
    const ordered = [...sites].sort(
      (a, b) => Number(b.built) - Number(a.built) || a.level - b.level || a.name.localeCompare(b.name),
    );
    for (const site of ordered) {
      const item = el('li');
      const button = el('button', 'site-list__item');
      button.type = 'button';
      const title = el('span', 'site-list__name', site.name);
      const mission = el('span', 'site-list__mission', `${site.mission}, ${site.missionYears}`);
      button.append(title, mission, levelBadge(site, levels));
      if (site.id === startSiteId) button.append(el('span', 'start-here', 'Start here'));
      if (!site.built) button.append(el('span', 'not-built', 'Not built yet'));
      button.addEventListener('click', () => onSelect(site.id));
      item.append(button);
      ul.append(item);
    }
    body.append(ul);

    const key = el('div', 'level-key');
    key.append(el('h2', undefined, 'Readiness levels'));
    for (const [number, level] of Object.entries(levels)) {
      const row = el('p');
      row.append(el('span', `level-badge level-${number}`, `Level ${number}: ${level.name}`), ` ${level.offers}`);
      key.append(row);
    }
    body.append(key);

    // The globe image's own record: who took it, when, how detailed it is and what not to read into it.
    const known = (value: string): boolean => value !== NOT_FOUND && value !== NOT_APPLICABLE;
    const about = el('div', 'image-record');
    about.append(
      el('h2', undefined, 'About the globe image'),
      el('p', undefined, `${image.title}. ${image.mission}, ${image.instrument}, ${image.agency}.`),
      el('p', undefined, `Imaged ${image.acquiredFrom} to ${image.acquiredTo}.${known(image.published) ? ` Mosaic published ${image.published}.` : ''}`),
      el('p', undefined, `Detail: ${image.realDetail}. Grade ${image.grade}: measured from orbit.`),
      list(image.caveats),
      el('p', undefined, `Credit: ${image.credit}.`),
      sourceLink(`Source: ${image.productId}`, image.sourceUrl),
    );
    body.append(about);

    if (rejected.length > 0) {
      const note = el('p', 'left-out');
      note.textContent =
        `${rejected.length} site${rejected.length === 1 ? ' is' : 's are'} left out because the record is incomplete: ` +
        rejected.map((r) => `${r.id} (${r.problems.join(', ')})`).join('; ');
      body.append(note);
    }
  }

  function showSite(site: SiteEntry): void {
    const level = levels[String(site.level)];
    body.replaceChildren();

    const back = el('button', 'link-button', 'All sites');
    back.type = 'button';
    back.addEventListener('click', onShowAll);

    const title = el('h2', 'card__title', site.name);
    // Some sites' place is their name ("Elysium Planitia. Elysium Planitia."); say it once.
    const place = el('p', 'card__place', `${site.place && site.place !== site.name ? `${site.place}. ` : ''}${site.mission}, ${site.missionYears}.`);
    body.append(back, title, place, levelBadge(site, levels));

    const state = el('p', site.built ? 'card__state' : 'card__state not-built-note');
    state.textContent = site.built
      ? 'This site is built. Open it to see the ground at walking scale.'
      : 'Not built yet. This version has no map or routes for this site; the globe shows only where it is.';
    body.append(state);

    if (site.built) {
      // Hidden by the style sheet once the site is open and its layer panel shows (F17).
      const open = el('button', 'primary-button card__open', 'Open this site');
      open.type = 'button';
      open.addEventListener('click', () => onOpen(site.id));
      body.append(open);
    }

    body.append(slot);
    if (level) body.append(section('What the app offers at this level', el('p', undefined, level.offers)));
    if (site.data.length > 0) body.append(section('Data that exists here', list(site.data)));

    const where = section('Where the marker stands', el('p', undefined, formatPosition(site)));
    if (site.position.what) where.append(el('p', undefined, site.position.what));
    where.append(sourceLink(`Source: ${site.position.source}`, site.position.sourceUrl));
    if (site.position.why) {
      where.append(el('p', undefined, site.position.why));
      if (site.position.whySourceUrl) where.append(sourceLink('Source: NASA', site.position.whySourceUrl));
    }
    if (site.terrainFootprint) {
      where.append(
        el('p', undefined, `The terrain model covers about ${site.terrainFootprint.widthKm} km east to west by ${site.terrainFootprint.heightKm} km north to south.`),
      );
    }
    body.append(where);

    if (site.landing) {
      const landing = section('Landing position as published', el('p', undefined, site.landing.asPublished));
      landing.append(sourceLink(`Source: ${site.landing.source}`, site.landing.sourceUrl));
      if (site.landing.insideTerrainFootprint === true) {
        landing.append(el('p', undefined, 'This position is inside the terrain model we hold.'));
      } else if (site.landing.insideTerrainFootprint === false) {
        landing.append(el('p', 'caution', 'This position is outside the terrain model we hold.'));
      }
      body.append(landing);
    }

    const cautions = [...site.problems];
    if (!site.reviewedByPerson) cautions.unshift('No person has reviewed this site yet.');
    if (cautions.length > 0) body.append(section('Know before you trust it', list(cautions)));
    panel.scrollTop = 0;
  }

  showList();
  return {
    slot,
    show(siteId) {
      const site = siteId === null ? undefined : sites.find((s) => s.id === siteId);
      if (site) showSite(site);
      else showList();
    },
  };
}
