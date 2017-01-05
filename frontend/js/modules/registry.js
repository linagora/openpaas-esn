'use strict';

angular.module('esn.registry', [
  'esn.lodash-wrapper'
])

  .provider('esnRegistry', function(_) {
    var registries = {},
        DEFAULT_OPTIONS = {
          primaryKey: 'name',
          match: function(key, item) {
            return item[this.options.primaryKey] === key; // Because the match function will have the registry as 'this'
          }
        };

    function Registry(name, options) {
      this.name = name;
      this.items = {};
      this.options = _.extend({}, DEFAULT_OPTIONS, options);
    }

    Registry.prototype.add = function(item) {
      this.items[item[this.options.primaryKey]] = item;
    };

    Registry.prototype.get = function(key) {
      return _.find(this.items, this.options.match.bind(this, key));
    };

    Registry.prototype.getAll = function() {
      return this.items;
    };

    function getRegistry(name, options) {
      if (!registries[name]) {
        registries[name] = new Registry(name, options);
      }

      return registries[name];
    }

    return {
      getRegistry: getRegistry,
      $get: _.constant(getRegistry)
    };
  });
