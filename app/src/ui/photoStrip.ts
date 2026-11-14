// WHAT:    Real rover photos taken near points on the route (F6).
// IN:      The site's photo index, through src/data/photos.ts; the route.
// OUT:     A strip of images, each with sol, Earth date, local time, camera, how far from the route it was taken, and credit.
// USED BY: src/ui/routePanel.ts.
// RULES:   No photo is shown further from where it was taken than the stated limit. Ordinary image elements only;
//          the pictures stay on NASA's server. Says plainly when there are none. Still to add: preferring photos that
//          face the direction of travel, which needs the mast's azimuth frame confirmed.
// TRAPS:   PITFALLS 2, 10.
// OWNER:   Role B.

import { loadPhotoIndex, PHOTO_LIMIT_M, photosNearRoute, type PhotoIndex } from '../data/photos';
import type { LonLat } from '../mars/geometry';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "21 Jul 2024" from an ISO time in UTC. */
function earthDate(isoUtc: string): string {
  const date = new Date(isoUtc);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export interface PhotoStrip {
  element: HTMLElement;
  /** Show the photos near a route, or clear the strip with null. */
  show(line: readonly LonLat[] | null): void;
}

export function createPhotoStrip(folderUrl: string): PhotoStrip {
  const box = document.createElement('section');
  box.className = 'photo-strip';
  box.hidden = true;
  const index: Promise<PhotoIndex | null> = loadPhotoIndex(folderUrl);
  let request = 0;

  return {
    element: box,
    show(line) {
      const mine = ++request;
      if (!line) { box.hidden = true; box.replaceChildren(); return; }
      void index.then((photos) => {
        if (mine !== request) return;
        box.replaceChildren();
        box.hidden = false;
        const title = document.createElement('h3');
        title.textContent = 'What the rover saw near this walk';
        box.append(title);
        const note = document.createElement('p');
        note.className = 'route-card__note';
        if (!photos) {
          note.textContent = 'No rover photos are indexed for this site.';
          box.append(note);
          return;
        }
        const near = photosNearRoute(photos.photos, line);
        if (near.length === 0) {
          note.textContent = `No rover photo was taken within ${PHOTO_LIMIT_M} m of this walk. The rover's stops are the green dots on the map.`;
          box.append(note);
          return;
        }
        const list = document.createElement('div');
        list.className = 'photo-strip__list';
        for (const { photo, distanceM } of near) {
          const figure = document.createElement('figure');
          const link = document.createElement('a');
          link.href = photo.pageUrl || photo.mediumUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          const image = document.createElement('img');
          image.src = photo.smallUrl;
          image.loading = 'lazy';
          image.alt = `View from the rover's mast at stop ${photo.stop} on sol ${photo.sol}`;
          link.append(image);
          const caption = document.createElement('figcaption');
          caption.textContent =
            `Sol ${photo.sol}, ${earthDate(photo.takenUtc)}, ${photo.localMeanSolarTime} local time. ${photo.camera}. ` +
            `Taken ${Math.round(distanceM)} m from this route, at rover stop ${photo.stop}. Credit: ${photo.credit}.`;
          figure.append(link, caption);
          list.append(figure);
        }
        note.textContent =
          `Real photos, measured on the ground (grade A), shown only if taken within ${PHOTO_LIMIT_M} m of the route. ` +
          `Each is the view from about where the rover stood on that day; which way it faces is not shown.`;
        box.append(list, note);
      });
    },
  };
}
