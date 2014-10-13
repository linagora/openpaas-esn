'use strict';

angular.module('esn.calendar', [])
  .factory('calendarService', ['$q', function($q) {

    function list(start, end, timezone) {
      var result = [
        // TODO temporary event for effects.
        {title: 'October Barcamp', start: new Date(2014, 9, 13), end: new Date(2014, 9, 17), color: '#f00'}
      ].filter(function(e) {
        return (e.start >= start && e.end <= end);
      });

      var defer = $q.defer();
      defer.resolve(result);
      return defer.promise;
    }

    function create(event) {
      var defer = $q.defer();
      defer.reject({message: 'Create is not implemented'});
      return defer.promise;
    }

    function remove(event) {
      var defer = $q.defer();
      defer.reject({message: 'Remove is not implemented'});
      return defer.promise;
    }

    function update(event) {
      var defer = $q.defer();
      defer.reject({message: 'Update is not implemented'});
      return defer.promise;
    }

    function accept(event) {
      var defer = $q.defer();
      defer.reject({message: 'Accept is not implemented'});
      return defer.promise;
    }

    function decline(event) {
      var defer = $q.defer();
      defer.reject({message: 'Decline is not implemented'});
      return defer.promise;
    }


    return {
      list: list,
      create: create,
      remove: remove,
      update: update,
      accept: accept,
      decline: decline
    };
  }]);
