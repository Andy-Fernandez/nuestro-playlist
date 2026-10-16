/// <reference lib="webworker" />

import { addPlugins, cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { RangeRequestsPlugin } from 'workbox-range-requests';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

// Apply Range handling to the precache itself; a later runtime route would never
// receive precached audio requests. Complete MP3s are available before activation.
addPlugins([new RangeRequestsPlugin()]);
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(new NavigationRoute(
  createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`),
  { denylist: [/\/(?:assets|audio|icons)\//] },
));

// There is deliberately no skipWaiting: updates wait until every Loveline window
// closes, so installing a new version cannot interrupt the current cassette.
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
