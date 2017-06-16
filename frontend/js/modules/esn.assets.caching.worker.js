var CACHE_NAME= 'esn.offline.assets';
var urlsToCache = [
  '/',
];

this.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        //Cache files needed for offline
        return cache.addAll(urlsToCache);
      })
  );
});

this.addEventListener('activate', function(event) {
  //To manage cache on service worker update
  console.log('OOOOOOOOOOO');
  console.log(event);
  return true;
});

this.addEventListener('fetch', function(event) {
  console.log('AAAAAAAAAAAAAAAAA');
  console.log(event);
  var fetchRequest = event.request.clone();
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      cache.match(event.request).then(function(cachedResponse) {
        fetchAndCache(fetchRequest).then(function(data) {
          return data;
        }).catch(function(error) {
          return cachedResponse;
        });
      }).catch(function() {
        var re = new RegExp('.*\.(html|css|js|woff2|svg|png)', 'i');
        if (event.request.url.test(re)) {
          fetchAndCache(fetchRequest).then(function(data) {
            return data;
          }).catch(function(error) {
            return error;
          });
        }
      });
    })
  );

  function fetchAndCache(request) {
    return fetch(fetchRequest, {credentials: 'include'}).then(function(response) {
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      var responseToCache = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, responseToCache);
      });

      return reponseToCache;
    });
  }
});
