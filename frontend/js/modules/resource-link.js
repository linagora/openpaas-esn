'use strict';

angular.module('esn.resource-link', ['esn.http'])
  .factory('ResourceLinkAPI', function(esnRestangular) {
    function create(source, target, type) {
      return esnRestangular.all('resource-links').customPOST({
        source: source,
        target: target,
        type: type
      });
    }

    function get(source, target, type) {
      return esnRestangular.all('resource-links').get({
        sourceId: source.id,
        sourceObjectType: target.objectType,
        targetId: source.id,
        targetObjectType: target.objectType,
        type: type
      });
    }

    function remove(source, target, type) {
      return get(source, target, type).then(function(link) {
        return esnRestangular.all('resource-links').customDELETE(link._id);
      });
    }

    return {
      create: create,
      remove: remove,
      get: get
    };
  });
