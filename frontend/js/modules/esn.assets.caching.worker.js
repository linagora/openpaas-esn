var CACHE_NAME= 'esn.offline.assets';
var urlsToCache = [
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        //Cache files needed for offline
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  //To manage cache on service worker update
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        var fetchRequest = event.request.clone();
        return fetch(fetchRequest).then(function(response) {
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return cachedResponse;
          }

          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseToCache);
           });

          return responseToCache;
        }).catch(function(error) {

          return cachedResponse;
        });
      })
  );
});
