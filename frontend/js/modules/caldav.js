'use strict';
angular.module('esn.caldav', [])
.factory('caldavAPI', ['Restangular', '$q', function(Restangular, $q) {
  var serverUrlCache = null;
  function getCaldavServerURL() {
    // return Restangular.get('caldavserver/' + id);
    // for now we mock it
    var d = $q.defer();
    d.resolve({data: {url: 'http://localhost/'}});
    return d.promise;
  }

  function getCachedCaldavServerURL() {
    if (serverUrlCache) {
      return serverUrlCache.promise;
    }
    serverUrlCache = $q.defer();
    getCaldavServerURL()
    .then(
      function(response) { serverUrlCache.resolve(response.data.url); },
      function(err) { serverUrlCache.reject(err); }
    );
    return serverUrlCache.promise;
  }

  function getEvent(eventId) {
    return getCachedCaldavServerURL()
    .then(function(url) {
      // do the request to the caldav server
      // for now we mock it
      var evtDefer = $q.defer();
      setTimeout(function() {
        evtDefer.resolve({
          id: eventId,
          title: 'I\'m a mock',
          description: 'Hey folks, please join us, it will be fun !',
          location: 'Linagora, 80 rue Roque de Fillol, Puteaux',
          startDate: new Date(2014, 11, 25, 3, 0),
          endDate: new Date(2014, 11, 25, 5, 0)
        });
      }, 3000);
      return evtDefer.promise;
    });
  }

  return {
    getCaldavServerURL: getCachedCaldavServerURL,
    getEvent: getEvent
  };
}]);
