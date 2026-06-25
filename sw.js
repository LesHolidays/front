// Service Worker basique pour rendre l'app installable (PWA)
const CACHE_NAME = 'holidays-cache-v1';

// L'événement d'installation est la première étape.
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force le SW à s'activer immédiatement
});

// L'événement activate permet de nettoyer les anciens caches si besoin
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// L'événement fetch est obligatoire pour qu'une PWA soit installable.
// Ici on fait juste "pass-through" (on laisse passer la requête normalement).
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
