// WHAT:    Tests for client.ts: worker replies and errors reach the right promise, so the page never waits forever.
// IN:      A fake worker built in this file as a test fixture; no real Worker and no search.
// OUT:     Pass or fail.
// USED BY: npm test.
// RULES:   The fixture grid definition is never read by the fake worker; it only fills the start message.
// TRAPS:   None known.
// OWNER:   Role B.

import { describe, expect, it } from 'vitest';
import type { GridDefinition } from '../data/contract';
import { startRouteWorker, type WorkerLike } from './client';
import type { Ready, Reply, Request, RouteAnswer } from './messages';

/** Test fixture: a worker that records what it is sent and lets the test reply. */
function fixtureWorker() {
  const sent: Request[] = [];
  const worker: WorkerLike = {
    onmessage: null,
    onerror: null,
    postMessage(message) { sent.push(message); },
    terminate() {},
  };
  const reply = (data: Reply): void => worker.onmessage?.({ data } as MessageEvent<Reply>);
  const crash = (message: string): void => worker.onerror?.({ message } as ErrorEvent);
  return { worker, sent, reply, crash };
}

function start(fake: ReturnType<typeof fixtureWorker>) {
  return startRouteWorker({
    definition: {} as GridDefinition,
    heightM: new ArrayBuffer(0),
    slopeMaxDeg: new ArrayBuffer(0),
    home: [0, 0],
    slopeLimitDeg: 20,
  }, () => fake.worker);
}

const fixtureReady = { type: 'ready', rows: 1, cols: 1, keepOut: new Uint8Array(1), homeUsable: true, homeCentre: [0, 0], keepOutShare: 0, reachableShare: 1, searchMs: 0 } as Ready;

function idOf(request: Request | undefined): number {
  if (request?.type !== 'route') throw new Error('expected a route request');
  return request.id;
}

describe('startRouteWorker', () => {
  it('resolves a route with its own answer', async () => {
    const fake = fixtureWorker();
    const client = start(fake);
    fake.reply(fixtureReady);
    await client.ready;
    const a = client.route([1, 1]);
    const b = client.route([2, 2]);
    const answerB: RouteAnswer = { type: 'route', id: idOf(fake.sent[2]), ok: false, reason: 'outside' };
    fake.reply(answerB);
    await expect(b).resolves.toBe(answerB);
    const answerA: RouteAnswer = { type: 'route', id: idOf(fake.sent[1]), ok: false, reason: 'keep-out' };
    fake.reply(answerA);
    await expect(a).resolves.toBe(answerA);
  });

  it('rejects only the request an error names', async () => {
    const fake = fixtureWorker();
    const client = start(fake);
    fake.reply(fixtureReady);
    await client.ready;
    const a = client.route([1, 1]);
    const b = client.route([2, 2]);
    fake.reply({ type: 'error', message: 'boom', id: idOf(fake.sent[1]) });
    await expect(a).rejects.toThrow('boom');
    const answerB: RouteAnswer = { type: 'route', id: idOf(fake.sent[2]), ok: false, reason: 'unreachable' };
    fake.reply(answerB);
    await expect(b).resolves.toBe(answerB);
  });

  it('rejects ready when the start fails', async () => {
    const fake = fixtureWorker();
    const client = start(fake);
    fake.reply({ type: 'error', message: 'bad grid' });
    await expect(client.ready).rejects.toThrow('bad grid');
  });

  it('rejects every waiting request on an error without an id after ready', async () => {
    const fake = fixtureWorker();
    const client = start(fake);
    fake.reply(fixtureReady);
    await client.ready;
    const a = client.route([1, 1]);
    const b = client.route([2, 2]);
    fake.reply({ type: 'error', message: 'lost' });
    await expect(a).rejects.toThrow('lost');
    await expect(b).rejects.toThrow('lost');
    // Later requests are refused at once rather than left waiting on a worker that failed.
    await expect(client.route([3, 3])).rejects.toThrow('lost');
  });

  it('rejects waiting and later requests once the worker has died', async () => {
    const fake = fixtureWorker();
    const client = start(fake);
    fake.reply(fixtureReady);
    await client.ready;
    const a = client.route([1, 1]);
    fake.crash('worker died');
    await expect(a).rejects.toThrow('worker died');
    await expect(client.route([2, 2])).rejects.toThrow('worker died');
  });
});
