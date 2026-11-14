// WHAT:    Tests for the space-weather parsing in data/feeds.ts and the banner's wording in weatherBanner.ts.
// IN:      Made-up notices in the wording of real NASA notices, built in this file as test fixtures.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   The banner says forecast, shows a window, and says when a snapshot is shown.
// TRAPS:   PITFALLS 8.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { marsForecasts, type SpaceWeather } from '../data/feeds';
import { bannerText } from './weatherBanner';

const ALERT = {
  messageID: 'FIXTURE-AL-001', messageURL: 'https://example.invalid/1', messageIssueTime: '2026-11-10T13:06Z',
  messageBody: 'the CME may impact STEREO A (minor impact), Mars (glancing blow), and Psyche (glancing blow).\n' +
    'The leading edge of the CME may reach STEREO A at 2026-11-12T01:00Z and the flank of the CME may reach ' +
    'Mars at 2026-11-13T12:00Z and Psyche at 2026-11-14T06:00Z (plus minus 7 hours).',
};
const OFFICE_ONLY = {
  messageID: 'FIXTURE-AL-002', messageURL: 'https://example.invalid/2', messageIssueTime: '2026-11-12T09:00Z',
  messageBody: 'The Moon to Mars Space Weather Analysis Office estimates the CME may impact Europa Clipper at 2026-11-15T12:00Z.',
};

function weather(from: 'live' | 'snapshot', forecasts = marsForecasts([ALERT])): SpaceWeather {
  return { from, fetchedUtc: '2026-11-14T13:41:04Z', periodFromUtc: '2026-10-31', periodToUtc: '2026-11-14', noticesRead: 16, forecasts };
}

describe('forecasts for Mars', () => {
  it('keeps what the notice states and adds nothing', () => {
    expect(marsForecasts([ALERT, OFFICE_ONLY])).toEqual([{
      arrivalUtc: '2026-11-13T12:00Z', windowHours: 7, kind: 'glancing blow',
      issuedUtc: '2026-11-10T13:06Z', messageId: 'FIXTURE-AL-001', messageUrl: 'https://example.invalid/1',
    }]);
  });
});

describe('the banner', () => {
  it('says forecast and gives a window, not a single time', () => {
    const text = bannerText(weather('live'), new Date('2026-11-12T00:00:00Z'));
    expect(text.headline).toBe('Space weather forecast, issued 10 Nov 13:06 UTC: a solar eruption may reach Mars (glancing blow) between 13 Nov 05:00 UTC and 13 Nov 19:00 UTC. That window is still ahead.');
    expect(text.ahead).toBe(true);
    expect(text.source).toContain('Live from NASA');
  });

  it('says when the window is open and when it has passed', () => {
    expect(bannerText(weather('live'), new Date('2026-11-13T10:00:00Z')).headline).toContain('That window is open now.');
    const passed = bannerText(weather('live'), new Date('2026-11-14T13:00:00Z'));
    expect(passed.headline).toContain('That window has passed.');
    expect(passed.ahead).toBe(false);
  });

  it('says when a saved snapshot is shown', () => {
    expect(bannerText(weather('snapshot'), new Date('2026-11-14T14:00:00Z')).source)
      .toBe("Saved snapshot, fetched 14 Nov 13:41 UTC: NASA's live feed could not be read just now, so this may be out of date.");
  });

  it('says so plainly when no notice forecasts an arrival at Mars', () => {
    expect(bannerText(weather('live', []), new Date('2026-11-14T14:00:00Z')).headline)
      .toBe('Space weather: none of the 16 NASA notices from 2026-10-31 to 2026-11-14 forecasts a solar eruption reaching Mars.');
  });
});
