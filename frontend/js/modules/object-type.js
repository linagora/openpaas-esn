'use strict';

angular.module('esn.object-type', [])
  .run(['objectTypeResolver', '$q', function(objectTypeResolver, $q) {
    objectTypeResolver.register('string', function(id) {
      var defer = $q.defer();
      defer.resolve(id);
      return defer.promise;
    });
  }])
  .factory('objectTypeAdapter', function() {

    var adapters = {};

    function register(objectType, adapter) {
      if (!objectType) {
        throw new Error('ObjectType can not be null');
      }

      if (!adapter) {
        throw new Error('Adapter can not be null');
      }

      if (!angular.isFunction(adapter)) {
        throw new Error('Adapter must be a function');
      }
      adapters[objectType] = adapter;
    }

    function adapt(model) {
      if (!model) {
        throw new Error('Model is required');
      }

      if (!model.objectType) {
        throw new Error('ObjectType is required');
      }

      var adapter = adapters[model.objectType];
      if (!adapter) {
        return model;
      }
      return adapter(model);
    }

    return {
      register: register,
      adapt: adapt
    };
  })
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
