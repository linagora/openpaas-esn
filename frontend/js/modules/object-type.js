'use strict';

angular.module('esn.object-type', [])
  .factory('objectTypeResolver', ['$q', function($q) {

    var resolvers = {};

    function register(objectType, resolver) {
      if (!objectType) {
        throw new Error('ObjectType can not be null');
      }

      if (!resolver) {
        throw new Error('Resolver can not be null');
      }

      if (!angular.isFunction(resolver)) {
        throw new Error('Resolver must be a function');
      }

      resolvers[objectType] = resolver;
    }

    function resolve(objectType, id) {
      var defer;
      if (!objectType) {
        defer = $q.defer();
        defer.reject(new Error(objectType + ' is not a valid resolver name'));
        return defer.promise;
      }

      if (!id) {
        defer = $q.defer();
        defer.reject(new Error('Resource id is required'));
        return defer.promise;
      }

      var resolver = resolvers[objectType];

      if (!resolver) {
        defer = $q.defer();
        defer.reject(new Error(objectType + ' is not a registered resolver'));
        return defer.promise;
      }

      return resolver(id);
    }

    return {
      register: register,
      resolve: resolve
    };
  }]);
