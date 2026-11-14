// WHAT:    Tests for the record checks in layers.ts and loadSites.ts. The records here are made-up test fixtures.
// IN:      Nothing.
// OUT:     Pass or fail under Vitest.
// USED BY: npm run check.
// RULES:   Fixture values are obviously not real: names say "fixture" and coordinates are round numbers.
// TRAPS:   PITFALLS 2.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import { NOT_APPLICABLE, NOT_FOUND, type LayerRecord, type ReadinessLevel, type SiteEntry } from './contract';
import { layerRecordProblems } from './layers';
import { siteEntryProblems } from './loadSites';

function fixtureLayer(): LayerRecord {
  return {
    id: 'image-fixture', title: 'Fixture image', dataType: 'optical',
    mission: 'Fixture mission', instrument: 'Fixture camera', agency: 'Fixture agency',
    productId: 'FIXTURE_1', sourceUrl: 'https://example.invalid/fixture', doi: NOT_FOUND,
    acquiredFrom: '2000', acquiredTo: '2001', published: NOT_FOUND,
    gridSpacing: '1 m', realDetail: '3 m', positionAccuracy: NOT_FOUND, heightAccuracy: NOT_APPLICABLE,
    processing: 'None', grade: 'B', caveats: ['A fixture.'], credit: 'Fixture credit',
  };
}

const fixtureLevels: Record<string, ReadinessLevel> = { '2': { name: 'Fixture level', offers: 'Nothing.' } };

function fixtureSite(): SiteEntry {
  return {
    id: 'fixture-site', name: 'Fixture', place: 'Nowhere', mission: 'None', missionYears: 'none',
    level: 2, built: false, reviewedByPerson: false, lonEastDeg: 10, latDeg: 20,
    position: { source: 'test fixture', sourceUrl: 'test fixture' },
    landing: null, data: [], problems: [],
  };
}

describe('layerRecordProblems', () => {
  it('accepts a complete record, with unknown optional fields marked as such', () => {
    expect(layerRecordProblems(fixtureLayer())).toEqual([]);
  });

  it('rejects a record with a field left out', () => {
    const record: Partial<LayerRecord> = fixtureLayer();
    delete record.credit;
    expect(layerRecordProblems(record)).toContain(`'credit' is missing`);
  });

  it('rejects a record whose dates or credit were not found', () => {
    expect(layerRecordProblems({ ...fixtureLayer(), acquiredFrom: NOT_FOUND })).toContain(`'acquiredFrom' must be known`);
    expect(layerRecordProblems({ ...fixtureLayer(), credit: NOT_FOUND })).toContain(`'credit' must be known`);
  });

  it('rejects empty caveats and an unknown grade', () => {
    expect(layerRecordProblems({ ...fixtureLayer(), caveats: [] })).toContain(`'caveats' is missing`);
    expect(layerRecordProblems({ ...fixtureLayer(), grade: 'E' as never })).toContain(`grade 'E' is not A, B, C or D`);
  });
});

describe('siteEntryProblems', () => {
  it('accepts a complete site', () => {
    expect(siteEntryProblems(fixtureSite(), fixtureLevels)).toEqual([]);
  });

  it('rejects a position with no cited source', () => {
    const site = { ...fixtureSite(), position: { source: '', sourceUrl: '' } };
    expect(siteEntryProblems(site, fixtureLevels)).toContain('the position has no cited source');
  });

  it('rejects longitudes that were not converted to -180 to 180', () => {
    expect(siteEntryProblems({ ...fixtureSite(), lonEastDeg: 312 }, fixtureLevels)).toContain(
      'longitude is missing or outside -180 to 180',
    );
    expect(siteEntryProblems({ ...fixtureSite(), latDeg: 95 }, fixtureLevels)).toContain(
      'latitude is missing or outside -90 to 90',
    );
  });

  it('rejects a readiness level that is not defined', () => {
    expect(siteEntryProblems({ ...fixtureSite(), level: 7 }, fixtureLevels)).toContain(`readiness level '7' is not defined`);
  });
});
