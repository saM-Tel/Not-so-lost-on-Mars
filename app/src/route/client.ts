// WHAT:    Page-side wrapper that starts the route worker and turns its messages into promises (F3). Still to add: tether requests (F4).
// IN:      The grid definition and files of a loaded site; home; the slope limit; route requests.
// OUT:     Promises of the keep-out cells and of routes with their statistics.
// USED BY: src/ui/routePanel.ts.
// RULES:   The page never runs a search itself.
// TRAPS:   PITFALLS 6.
// OWNER:   Role B.

import type { GridDefinition } from '../data/contract';
import type { LonLat } from '../mars/geometry';
import type { Ready, Reply, Request, RouteAnswer } from './messages';

export interface RouteClient {
  /** Resolves when the worker has searched from home. */
  ready: Promise<Ready>;
  /** Ask for the walk from home to a position and back. A later request does not cancel an earlier one. */
  route(target: LonLat): Promise<RouteAnswer>;
  stop(): void;
}

export function startRouteWorker(options: {
  definition: GridDefinition;
  heightM: ArrayBuffer;
  slopeMaxDeg: ArrayBuffer;
  home: LonLat;
  slopeLimitDeg: number;
}): RouteClient {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  const waiting = new Map<number, (answer: RouteAnswer) => void>();
  let nextId = 1;
  let resolveReady: (ready: Ready) => void = () => {};
  let rejectReady: (error: Error) => void = () => {};
  const ready = new Promise<Ready>((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });

  worker.onmessage = (event: MessageEvent<Reply>): void => {
    const reply = event.data;
    if (reply.type === 'ready') resolveReady(reply);
    else if (reply.type === 'route') {
      waiting.get(reply.id)?.(reply);
      waiting.delete(reply.id);
    } else rejectReady(new Error(reply.message));
  };
  worker.onerror = (event): void => rejectReady(new Error(event.message || 'The route worker stopped.'));

  const first: Request = { type: 'init', ...options };
  worker.postMessage(first, [options.heightM, options.slopeMaxDeg]);

  return {
    ready,
    route(target) {
      const id = nextId++;
      const request: Request = { type: 'route', id, target };
      return new Promise((resolve) => {
        waiting.set(id, resolve);
        worker.postMessage(request);
      });
    },
    stop() {
      worker.terminate();
      waiting.clear();
    },
  };
}
