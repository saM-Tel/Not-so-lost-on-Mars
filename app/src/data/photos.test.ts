// WHAT:    Tests for choosing rover photos near a route, in photos.ts.
// IN:      Made-up photo records and a made-up route, built in this file as test fixtures.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   Distances are worked by hand from the Mars radius: one degree of latitude is 59,274.7 m.
// TRAPS:   PITFALLS 3.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { METRES_PER_DEGREE } from '../mars/constants';
import { photosNearRoute, type RoverPhoto } from './photos';

/** Test fixture: a photo at a stop the given number of metres north of latitude 18.5, on longitude 77.3. */
function fixturePhoto(id: string, stop: string, northM: number): RoverPhoto {
  return { id, stop, lonEastDeg: 77.3, latDeg: 18.5 + northM / METRES_PER_DEGREE } as RoverPhoto;
}

/** Test fixture: a route going north along longitude 77.3 from latitude 18.5, a point every 10 m for 200 m. */
const route: [number, number][] = Array.from({ length: 21 }, (_, i) => [77.3, 18.5 + (i * 10) / METRES_PER_DEGREE]);

/** A stop 20 m east of the route, at a given distance north. At this latitude a degree of longitude is 56,212 m. */
function offRoute(id: string, stop: string, northM: number, eastM: number): RoverPhoto {
  const photo = fixturePhoto(id, stop, northM);
  return { ...photo, lonEastDeg: 77.3 + eastM / (METRES_PER_DEGREE * Math.cos((18.5 * Math.PI) / 180)) };
}

describe('photos near a route', () => {
  it('keeps only photos taken within the limit, with their distance', () => {
    const photos = [offRoute('near', '1_0', 50, 20), offRoute('far', '2_0', 100, 45)];
    const found = photosNearRoute(photos, route, 30);
    expect(found.map((f) => f.photo.id)).toEqual(['near']);
    expect(found[0]!.distanceM).toBeCloseTo(20, 0);
  });

  it('orders them as the walker passes them', () => {
    const photos = [fixturePhoto('late', '2_0', 150), fixturePhoto('early', '1_0', 30)];
    expect(photosNearRoute(photos, route).map((f) => f.photo.id)).toEqual(['early', 'late']);
  });

  it('takes at most two from one stop and six in all', () => {
    const many = ['1_0', '2_0', '3_0', '4_0'].flatMap((stop, s) =>
      [0, 1, 2, 3].map((i) => fixturePhoto(`${stop}-${i}`, stop, 20 + s * 40)));
    const found = photosNearRoute(many, route);
    expect(found).toHaveLength(6);
    expect(found.filter((f) => f.photo.stop === '1_0').map((f) => f.photo.id)).toEqual(['1_0-0', '1_0-2']);
  });

  it('finds none when the route passes no stop', () => {
    expect(photosNearRoute([offRoute('far', '1_0', 50, 400)], route)).toEqual([]);
  });
});
