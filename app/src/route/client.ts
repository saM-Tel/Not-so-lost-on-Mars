// WHAT:    Page-side wrapper that starts the route worker and turns its messages into promises (F3, F4).
// IN:      The grid definition and files of a loaded site; home; the slope limit; route requests.
// OUT:     Promises of the keep-out cells, of the time to walk home from every cell, and of routes with their statistics.
// USED BY: src/ui/routePanel.ts; client.test.ts passes a fake worker.
// RULES:   The page never runs a search itself. Every route promise settles: a worker error rejects the request it
//          names, or every waiting request when it names none; once the worker has died, new requests reject at once.
// TRAPS:   PITFALLS 6. `tether` never rejects, so a failed start shows only through `ready`.
// OWNER:   Role B.

import type { GridDefinition } from '../data/contract';
import type { LonLat } from '../mars/geometry';
import type { Ready, Reply, Request, RouteAnswer, TetherFields } from './messages';

export interface RouteClient {
  /** Resolves when the worker has searched from home. */
  ready: Promise<Ready>;
  /** Resolves a little later, with the time to walk home from every cell. */
  tether: Promise<TetherFields>;
  /** Home to the target and back; with `via`, through those stops first (F3). A later request does not cancel an
   *  earlier one. Rejects if the worker fails while answering it. */
  route(target: LonLat, via?: LonLat[]): Promise<RouteAnswer>;
  stop(): void;
}

/** The part of a Worker this wrapper uses, so tests can pass a fake one. */
export interface WorkerLike {
  onmessage: ((event: MessageEvent<Reply>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(message: Request, transfer?: Transferable[]): void;
  terminate(): void;
}

export function startRouteWorker(
  options: {
    definition: GridDefinition;
    heightM: ArrayBuffer;
    slopeMaxDeg: ArrayBuffer;
    home: LonLat;
    slopeLimitDeg: number;
  },
  makeWorker: () => WorkerLike = () =>
    new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike,
): RouteClient {
  const worker = makeWorker();
  const waiting = new Map<number, { resolve: (answer: RouteAnswer) => void; reject: (error: Error) => void }>();
  let nextId = 1;
  let broken: Error | null = null;
  let resolveReady: (ready: Ready) => void = () => {};
  let rejectReady: (error: Error) => void = () => {};
  const ready = new Promise<Ready>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  let resolveTether: (fields: TetherFields) => void = () => {};
  const tether = new Promise<TetherFields>((resolve) => { resolveTether = resolve; });

  /** Reject `ready` (a no-op once it has resolved) and every request still waiting. */
  const failAll = (error: Error): void => {
    rejectReady(error);
    for (const pending of waiting.values()) pending.reject(error);
    waiting.clear();
  };

  worker.onmessage = (event: MessageEvent<Reply>): void => {
    const reply = event.data;
    if (reply.type === 'ready') resolveReady(reply);
    else if (reply.type === 'tether') resolveTether(reply);
    else if (reply.type === 'route') {
      waiting.get(reply.id)?.resolve(reply);
      waiting.delete(reply.id);
    } else if (reply.id !== undefined) {
      waiting.get(reply.id)?.reject(new Error(reply.message));
      waiting.delete(reply.id);
    } else {
      // An error naming no request comes from setting up (grids, tether): the worker cannot be trusted after it, so
      // later requests are refused at once rather than left waiting.
      broken = new Error(reply.message);
      failAll(broken);
    }
  };
  worker.onerror = (event): void => {
    broken = new Error(event.message || 'The route worker stopped.');
    failAll(broken);
  };

  const first: Request = { type: 'init', ...options };
  worker.postMessage(first, [options.heightM, options.slopeMaxDeg]);

  return {
    ready,
    tether,
    route(target, via) {
      if (broken) return Promise.reject(broken);
      const id = nextId++;
      const request: Request = { type: 'route', id, target, ...(via && via.length > 0 ? { via } : {}) };
      return new Promise((resolve, reject) => {
        waiting.set(id, { resolve, reject });
        worker.postMessage(request);
      });
    },
    stop() {
      worker.terminate();
      waiting.clear();
    },
  };
}
