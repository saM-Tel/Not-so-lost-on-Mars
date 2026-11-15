// WHAT:    "When should I go?" (F11): a slider for the start time in local solar time, the Sun's height then, sunrise and
//          sunset for today's season, whether the planned walk ends in daylight, and typical weather for the season where
//          the site has a weather station record: by Mars month (Curiosity REMS at Gale), or by local hour at the start
//          time and over the walk (Perseverance MEDA at Bright Angel).
// IN:      The site's position; the planned walk's cautious duration; public/data/weather/<site id>.json if it exists,
//          in its monthly or hourly form (docs/DATA_CONTRACT.md).
// OUT:     A section for the route card.
// USED BY: src/ui/routePanel.ts.
// RULES:   Sun and daylight are "computed"; weather values are "typical" with the number of sols behind them. A site with
//          no station record shows no weather: weather is never borrowed from another site.
// TRAPS:   PITFALLS 3, 9.
// OWNER:   Role B.

import { SOL_S } from '../mars/constants';
import { sunAtLocalTime, sunriseSunset } from '../mars/sun';
import { marsMonth, seasonName, solarLongitudeDeg } from '../mars/time';
import { formatDuration } from './format';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Mars hours as hh:mm. One Mars hour is a 24th of a sol. */
export function formatMarsClock(hours: number): string {
  const wrapped = ((hours % 24) + 24) % 24;
  const h = Math.floor(wrapped);
  const m = Math.floor((wrapped - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface Percentiles { sols: number; p10?: number; p50?: number; p90?: number }
interface WeatherMonth {
  month: number; sols: number; airLowC: Percentiles; airHighC: Percentiles; pressurePa: Percentiles;
  ultraviolet: Record<string, number>; sky: Record<string, number>;
}
interface WeatherFile {
  source: { mission: string; instrument: string; credit: string; acquiredFrom: string; acquiredTo: string; sourceUrl: string };
  months: WeatherMonth[];
}

function typical(p: Percentiles, unit: string): string {
  if (p.p50 === undefined) return 'no data';
  return `${p.p50} ${unit} (${p.p10} to ${p.p90})`;
}

/** The same, with the number of sols behind it, as the hourly values come from fewer sols each. */
function typicalWithSols(p: Percentiles, unit: string): string {
  if (p.p50 === undefined) return `no data (${p.sols} sol${p.sols === 1 ? '' : 's'} with readings at this hour; 5 needed)`;
  return `${p.p50} ${unit} (${p.p10} to ${p.p90}), over ${p.sols} sols`;
}

interface WeatherHour { hour: number; pressurePa: Percentiles; sensorTempC: Percentiles; windMps: Percentiles }
/** Typical weather by local true solar hour for one season (pipeline/meda.py). */
interface HourlyWeatherFile {
  kind: 'hourly';
  source: { mission: string; instrument: string; credit: string; acquiredFrom: string; acquiredTo: string; sourceUrl: string; caveats: string[] };
  season: { lsFromDeg: number | null; lsToDeg: number | null; windows: { solFrom: number; solTo: number; sols: number }[] };
  measuredAt: { distanceKmMin: number; distanceKmMax: number } | null;
  hours: WeatherHour[];
}

export interface TimePanel {
  element: HTMLElement;
  /** Tell the panel how long the planned walk takes in the cautious case, seconds, or null for no walk. */
  setWalk(cautiousS: number | null): void;
}

export function createTimePanel(options: {
  lonEastDeg: number; latDeg: number; weatherUrl: string; now?: Date;
  /** Called with the Sun position when computed shading is on, or null when it is off or the Sun is down. */
  onSun?: (sun: { azimuthDeg: number; elevationDeg: number } | null) => void;
}): TimePanel {
  const now = options.now ?? new Date();
  const ls = solarLongitudeDeg(now);
  const month = marsMonth(ls);
  const box = el('section', 'when');
  box.append(el('h3', undefined, 'When to go'));
  const season = el('p', 'route-card__note',
    `Today it is ${seasonName(ls, options.latDeg)} on Mars: solar longitude ${ls.toFixed(0)} degrees, Mars month ${month}. Computed with NASA's Mars24 method.`);

  const slider = el('input');
  slider.type = 'range';
  slider.id = 'when-start';
  slider.min = '0';
  slider.max = '23.5';
  slider.step = '0.25';
  slider.value = '9';
  const label = el('label', undefined, 'Start the walk at ');
  label.htmlFor = slider.id;
  const clock = el('strong', undefined, '09:00');
  const row = el('p', 'tether__row');
  row.append(label, slider, clock);

  const sunLine = el('p', 'when__sun');
  const shadeBox = el('input');
  shadeBox.type = 'checkbox';
  shadeBox.id = 'when-shade';
  const shadeLabel = el('label', undefined, ' Shade the ground for this Sun (computed; slopes facing away from the Sun, not cast shadows)');
  shadeLabel.htmlFor = shadeBox.id;
  const shadeRow = el('p', 'route-card__note');
  shadeRow.append(shadeBox, shadeLabel);
  const walkLine = el('p', 'when__walk');
  walkLine.setAttribute('role', 'status');
  const weather = el('div', 'when__weather');
  let walkS: number | null = null;
  let hourly: HourlyWeatherFile | null = null;

  /** Typical weather at the start hour and over the walk, from an hourly station record. */
  const renderHourly = (): void => {
    if (!hourly) return;
    const file = hourly;
    const start = Number(slider.value);
    const hour = Math.floor(start) % 24;
    const at = file.hours.find((h) => h.hour === hour);
    const { lsFromDeg, lsToDeg } = file.season;
    const inSeason = lsFromDeg !== null && lsToDeg !== null && ls >= lsFromDeg && ls <= lsToDeg;
    const list = el('ul', 'route-card__note');
    if (at) {
      list.append(
        el('li', undefined, `Pressure: ${typicalWithSols(at.pressurePa, 'Pa')}. Under 1% of Earth's at sea level.`),
        el('li', undefined, `Temperature inside the rover's humidity sensor, which follows the air but is not an air temperature: ${typicalWithSols(at.sensorTempC, '°C')}.`),
        el('li', undefined, `Wind: ${typicalWithSols(at.windMps, 'm/s')}.`),
      );
    }
    if (walkS !== null) {
      const end = start + walkS / (SOL_S / 24);
      const medians: { hour: number; c: number }[] = [];
      for (let h = Math.floor(start); h <= Math.floor(end); h++) {
        const entry = file.hours.find((x) => x.hour === ((h % 24) + 24) % 24);
        if (entry?.sensorTempC.p50 !== undefined) medians.push({ hour: entry.hour, c: entry.sensorTempC.p50 });
      }
      if (medians.length > 0) {
        const cold = medians.reduce((a, b) => (b.c < a.c ? b : a));
        const warm = medians.reduce((a, b) => (b.c > a.c ? b : a));
        list.append(el('li', undefined,
          `During this walk, ${formatMarsClock(start)} to ${formatMarsClock(end)} in the cautious case: the sensor's typical temperature runs from ` +
          `${cold.c} °C (around ${formatMarsClock(cold.hour)}) to ${warm.c} °C (around ${formatMarsClock(warm.hour)}), the median of each hour.`));
      }
    }
    const seasonLine = el('p', inSeason ? 'route-card__note' : 'route-card__note when__walk--warn',
      inSeason
        ? `Typical for this season: solar longitude ${lsFromDeg} to ${lsToDeg} degrees, and today it is ${ls.toFixed(0)}.`
        : `Not this season. These are for solar longitude ${lsFromDeg ?? '?'} to ${lsToDeg ?? '?'} degrees, and today it is ${ls.toFixed(0)}. Weather changes with the season, so take them as a guide to that season only.`);
    const ranges = file.season.windows.map((w) => `${w.solFrom} to ${w.solTo}`);
    const sols = ranges.length > 1 ? `${ranges.slice(0, -1).join(', ')} and ${ranges[ranges.length - 1]}` : ranges.join('');
    const where = file.measuredAt ? `, measured where the rover was, ${file.measuredAt.distanceKmMin} to ${file.measuredAt.distanceKmMax} km from this site` : '';
    const source = el('p', 'route-card__note',
      `Typical, not a forecast: for each hour of local solar time, the median of the hourly means, with the 10th to 90th percentile in brackets, ` +
      `from ${file.source.instrument} on ${file.source.mission}, sols ${sols}, ${file.source.acquiredFrom.slice(0, 4)} to ${file.source.acquiredTo.slice(0, 4)}${where}. ${file.source.credit}. Grade A.`);
    const details = el('details', 'route-card__basis');
    details.append(el('summary', undefined, 'What these numbers rest on'));
    const caveats = el('ul');
    for (const text of file.source.caveats) caveats.append(el('li', undefined, text));
    details.append(caveats);
    weather.replaceChildren(el('h4', undefined, `Typical weather at ${formatMarsClock(hour)}${inSeason ? ' this season' : ''}`), seasonLine, list, source, details);
  };

  const daylight = sunriseSunset(options.latDeg, ls);
  const update = (): void => {
    const start = Number(slider.value);
    clock.textContent = `${formatMarsClock(start)} local solar time`;
    const sun = sunAtLocalTime(start, options.latDeg, ls);
    options.onSun?.(shadeBox.checked && sun.elevationDeg > 0 ? sun : null);
    const sunText = sun.elevationDeg > 0
      ? `The Sun is ${sun.elevationDeg.toFixed(0)} degrees up, towards ${sun.azimuthDeg.toFixed(0)} degrees from north.`
      : 'The Sun is down: it is night.';
    sunLine.textContent = daylight
      ? `${sunText} Today the Sun rises at ${formatMarsClock(daylight.riseHours)} and sets at ${formatMarsClock(daylight.setHours)} local solar time (computed for a flat horizon; hills make the day shorter).`
      : `${sunText} At this latitude and season the Sun does not rise and set today (computed).`;
    renderHourly();
    if (walkS === null || !daylight) {
      walkLine.textContent = walkS === null ? 'Plan a walk to see whether it ends in daylight.' : '';
      walkLine.className = 'when__walk';
      return;
    }
    const marsHours = walkS / (SOL_S / 24);
    const end = start + marsHours;
    const inDaylight = start >= daylight.riseHours && end <= daylight.setHours;
    walkLine.textContent = inDaylight
      ? `Back by about ${formatMarsClock(end)} in the cautious case, ${formatDuration((daylight.setHours - end) * (SOL_S / 24))} before sunset. The whole walk is in daylight.`
      : start < daylight.riseHours
        ? `This starts before sunrise (${formatMarsClock(daylight.riseHours)}). Walking in the dark is not advised.`
        : `Back by about ${formatMarsClock(end)} in the cautious case, after sunset at ${formatMarsClock(daylight.setHours)}. Start earlier, or choose a shorter walk.`;
    walkLine.className = inDaylight ? 'when__walk' : 'when__walk when__walk--warn';
  };
  slider.addEventListener('input', update);
  shadeBox.addEventListener('change', update);
  update();

  // Typical weather for this Mars month, only where the site has its own station record.
  fetch(options.weatherUrl).then(async (response) => {
    if (!response.ok) throw new Error('none');
    const loaded = (await response.json()) as WeatherFile | HourlyWeatherFile;
    if ('hours' in loaded) { hourly = loaded; renderHourly(); return; }
    const file = loaded;
    const m = file.months.find((entry) => entry.month === month);
    if (!m || m.sols === 0) throw new Error('none');
    const uv = Object.entries(m.ultraviolet).sort((a, b) => b[1] - a[1])[0];
    const list = el('ul', 'route-card__note');
    for (const text of [
      `Air at its coldest: ${typical(m.airLowC, '°C')}; at its warmest: ${typical(m.airHighC, '°C')}.`,
      `Pressure: ${typical(m.pressurePa, 'Pa')}, under 1% of Earth's at sea level.`,
      ...(uv ? [`Ultraviolet most often reported as "${uv[0]}" (${uv[1]} of ${m.sols} sols).`] : []),
    ]) list.append(el('li', undefined, text));
    const source = el('p', 'route-card__note');
    source.append(
      `Typical for Mars month ${month}: median, with the 10th to 90th percentile in brackets, over ${m.sols} sols measured by ` +
      `${file.source.instrument} on ${file.source.mission}, ${file.source.acquiredFrom} to ${file.source.acquiredTo}. ${file.source.credit}. `,
    );
    weather.replaceChildren(el('h4', undefined, 'Typical weather this season'), list, source);
  }).catch(() => {
    weather.replaceChildren(el('p', 'route-card__note',
      'Weather: no data. Our files hold no weather station record for this site, and weather is never borrowed from another site.'));
  });

  box.append(season, row, sunLine, shadeRow, walkLine, weather);
  return {
    element: box,
    setWalk(cautiousS) { walkS = cautiousS; update(); },
  };
}
