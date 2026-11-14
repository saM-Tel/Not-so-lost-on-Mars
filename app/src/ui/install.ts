// WHAT:    Makes the built site an installable app: registers the service worker that keeps files on the device, and shows
//          an "Install app" button when the browser offers installation (F8).
// IN:      The page; the browser's install offer.
// OUT:     A registered service worker (built site only); a button in the page corner while installing is possible.
// USED BY: src/main.ts.
// RULES:   Never registers in the dev server, so development always sees fresh files. Nothing here is needed for the app
//          to work: if the browser has no service workers the site behaves as before.
// TRAPS:   PITFALLS 10.
// OWNER:   Role B.

/** The browser's install offer. Not in TypeScript's DOM types, so it is described here. */
interface InstallOffer extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function setUpInstall(): void {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch((error: unknown) => {
        console.warn('The app could not keep files on this device:', error);
      });
    });
  }

  let offer: InstallOffer | null = null;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'install-button';
  button.textContent = 'Install app';
  button.title = 'Install Tether as an app on this device. It opens in its own window and keeps the map files it has shown.';
  button.hidden = true;
  button.addEventListener('click', () => {
    if (!offer) return;
    void offer.prompt();
    void offer.userChoice.finally(() => { offer = null; button.hidden = true; });
  });
  document.body.append(button);

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    offer = event as InstallOffer;
    button.hidden = false;
  });
  window.addEventListener('appinstalled', () => { offer = null; button.hidden = true; });
}
