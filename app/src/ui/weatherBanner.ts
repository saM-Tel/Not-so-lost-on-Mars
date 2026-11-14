// WHAT:    Space-weather banner (one line that opens for the full forecast; open by itself while a window is ahead, F17): the latest NASA forecast that names Mars, with issue time and arrival window (F5).
// IN:      Forecasts from src/data/feeds.ts; the time now.
// OUT:     A banner element over the map, and the sentence it shows.
// USED BY: src/main.ts.
// RULES:   Says forecast. Shows a window, not a single time. Says when a snapshot is shown, and how old it is.
// TRAPS:   PITFALLS 8.
// OWNER:   Role B.

import { loadSpaceWeather, type SpaceWeather } from '../data/feeds';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A UTC time in plain words: "13 Nov 12:00 UTC". */
export function formatUtc(time: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${time.getUTCDate()} ${MONTHS[time.getUTCMonth()]} ${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())} UTC`;
}

export interface BannerText {
  /** The forecast, or that there is none. */
  headline: string;
  /** Where it came from and how fresh it is. */
  source: string;
  /** True when an arrival window is still open or ahead, so the banner should stand out. */
  ahead: boolean;
}

/** What the banner says for a set of forecasts at a given time. */
export function bannerText(weather: SpaceWeather, now: Date): BannerText {
  const fetched = new Date(weather.fetchedUtc);
  const source = weather.from === 'live'
    ? `Live from NASA, fetched ${formatUtc(fetched)}.`
    : `Saved snapshot, fetched ${formatUtc(fetched)}: NASA's live feed could not be read just now, so this may be out of date.`;
  const latest = weather.forecasts[0];
  if (!latest) {
    return {
      headline: `Space weather: none of the ${weather.noticesRead} NASA notices from ${weather.periodFromUtc} to ${weather.periodToUtc} forecasts a solar eruption reaching Mars.`,
      source, ahead: false,
    };
  }
  const arrival = new Date(latest.arrivalUtc);
  const hours = latest.windowHours;
  const start = hours === null ? arrival : new Date(arrival.getTime() - hours * 3_600_000);
  const end = hours === null ? arrival : new Date(arrival.getTime() + hours * 3_600_000);
  const when = hours === null
    ? `at about ${formatUtc(arrival)}; the notice gives no uncertainty`
    : `between ${formatUtc(start)} and ${formatUtc(end)}`;
  const state = now > end ? 'That window has passed.' : now >= start ? 'That window is open now.' : 'That window is still ahead.';
  const kind = latest.kind ? ` (${latest.kind})` : '';
  return {
    headline: `Space weather forecast, issued ${formatUtc(new Date(latest.issuedUtc))}: a solar eruption may reach Mars${kind} ${when}. ${state}`,
    source, ahead: now <= end,
  };
}

/** Add the banner to the map's container and fill it once the forecasts are read. Returns nothing: it stays for the session. */
export function addWeatherBanner(parent: HTMLElement, dataUrl: string): void {
  // One line that opens for the full forecast and its source (F17: the full text covered the map all the time). It
  // opens by itself only while a forecast window is still ahead or open, which is when it matters.
  const banner = document.createElement('details');
  banner.className = 'weather-banner';
  banner.setAttribute('aria-label', 'Space weather forecast');
  const summary = document.createElement('summary');
  summary.className = 'weather-banner__summary';
  summary.textContent = 'Space weather: reading NASA\'s forecast…';
  const headline = document.createElement('p');
  headline.className = 'weather-banner__headline';
  const source = document.createElement('p');
  source.className = 'weather-banner__source';
  banner.append(summary, headline, source);
  parent.append(banner);

  loadSpaceWeather(dataUrl).then((weather) => {
    const text = bannerText(weather, new Date());
    headline.textContent = text.headline;
    summary.textContent = weather.forecasts.length === 0
      ? 'Space weather: no forecast for Mars'
      : text.ahead ? 'Space weather forecast: a solar eruption may reach Mars' : 'Space weather: the latest forecast window for Mars has passed';
    banner.open = text.ahead;
    banner.classList.toggle('weather-banner--ahead', text.ahead);
    source.textContent = `${text.source} A forecast, not a measurement. NASA calls these notices experimental; arrival times at Earth are typically wrong by about 10 hours. `;
    const latest = weather.forecasts[0];
    if (latest?.messageUrl) {
      const link = document.createElement('a');
      link.href = latest.messageUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `NASA notice ${latest.messageId}`;
      source.append(link);
    }
  }).catch((error: unknown) => {
    summary.textContent = 'Space weather: no data';
    headline.textContent = 'Space weather: no data. ' + (error instanceof Error ? error.message : String(error));
  });
}
