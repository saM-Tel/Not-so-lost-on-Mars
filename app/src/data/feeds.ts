// WHAT:    Reads NASA's space-weather notices that forecast a solar eruption reaching Mars: live, or else the saved snapshot (F5).
// IN:      NASA DONKI notifications through api.nasa.gov; public/data/space-weather.json, written by pipeline/build_space_weather.py.
// OUT:     Forecasts with issue time, arrival time and stated uncertainty; when they were fetched; whether they are live or a snapshot.
// USED BY: src/ui/weatherBanner.ts.
// RULES:   Always says which of live or snapshot is shown. A forecast is never called a measurement. Nothing is added to
//          what a notice says: the parsing matches pipeline/build_space_weather.py.
// TRAPS:   PITFALLS 8, 10. NASA's public demo key allows only a few requests an hour, so the live read often fails.
// OWNER:   Role B.

/** One forecast arrival at Mars, as a NASA notice states it. */
export interface MarsForecast {
  /** When the eruption is forecast to reach Mars, UTC, ISO 8601. */
  arrivalUtc: string;
  /** The uncertainty the notice states, as plus or minus this many hours; null when it states none. */
  windowHours: number | null;
  /** The notice's own words for how Mars is hit, such as "glancing blow"; null when it gives none. */
  kind: string | null;
  /** When the notice was issued, UTC. */
  issuedUtc: string;
  messageId: string;
  messageUrl: string;
}

export interface SpaceWeather {
  /** 'live' when fetched from NASA by this page just now; 'snapshot' when read from our saved file. */
  from: 'live' | 'snapshot';
  fetchedUtc: string;
  periodFromUtc: string;
  periodToUtc: string;
  noticesRead: number;
  /** Newest notice first. Empty when no notice in the period forecasts an arrival at Mars. */
  forecasts: MarsForecast[];
}

interface Notice {
  messageID?: string;
  messageURL?: string;
  messageIssueTime?: string;
  messageBody?: string;
}

const ARRIVAL = /Mars at (\d{4}-\d\d-\d\dT\d\d:\d\dZ)(?: \(([a-z ]+)\))?/g;
const WINDOW = /plus minus (\d+) hours/;
const KIND = /Mars \(([a-z ]+)\)/;
const DAYS = 14;

/**
 * Every arrival at Mars that the notices forecast, newest notice first, one entry for each arrival time.
 * A notice counts only if it gives a time for Mars in the form "Mars at 2026-11-13T12:00Z".
 */
export function marsForecasts(notices: Notice[]): MarsForecast[] {
  const found = new Map<string, MarsForecast>();
  const newestFirst = [...notices].sort((a, b) => (b.messageIssueTime ?? '').localeCompare(a.messageIssueTime ?? ''));
  for (const notice of newestFirst) {
    const body = (notice.messageBody ?? '').replace(/\n/g, ' ');
    for (const match of body.matchAll(ARRIVAL)) {
      const arrival = match[1]!;
      if (found.has(arrival)) continue;
      const window = WINDOW.exec(body);
      found.set(arrival, {
        arrivalUtc: arrival,
        windowHours: window ? Number(window[1]) : null,
        kind: match[2] ?? KIND.exec(body)?.[1] ?? null,
        issuedUtc: notice.messageIssueTime ?? '',
        messageId: notice.messageID ?? '',
        messageUrl: notice.messageURL ?? '',
      });
    }
  }
  return [...found.values()].sort((a, b) => b.issuedUtc.localeCompare(a.issuedUtc));
}

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Try NASA's live feed. Rejects when the feed cannot be read, for example when the demo key's allowance is used up. */
async function live(now: Date): Promise<SpaceWeather> {
  const from = day(new Date(now.getTime() - DAYS * 86_400_000));
  const to = day(now);
  const url = `https://api.nasa.gov/DONKI/notifications?startDate=${from}&endDate=${to}&type=all&api_key=DEMO_KEY`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`NASA's feed answered with status ${response.status}.`);
  const notices = (await response.json()) as Notice[];
  if (!Array.isArray(notices)) throw new Error("NASA's feed did not return a list of notices.");
  return {
    from: 'live', fetchedUtc: now.toISOString().slice(0, 19) + 'Z', periodFromUtc: from, periodToUtc: to,
    noticesRead: notices.length, forecasts: marsForecasts(notices),
  };
}

/**
 * The latest forecasts for Mars: live if NASA's feed answers, otherwise our saved snapshot, labelled as such.
 * `dataUrl` is the folder that holds space-weather.json. Rejects only when neither can be read.
 */
export async function loadSpaceWeather(dataUrl: string, now: Date = new Date()): Promise<SpaceWeather> {
  try {
    return await live(now);
  } catch {
    const response = await fetch(`${dataUrl}space-weather.json`);
    if (!response.ok) throw new Error('Neither NASA\'s live feed nor our saved snapshot could be read.');
    const saved = (await response.json()) as Omit<SpaceWeather, 'from'>;
    return { ...saved, from: 'snapshot' };
  }
}
