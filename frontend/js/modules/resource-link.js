'use strict';

angular.module('esn.resource-link', ['esn.http'])
  .factory('ResourceLinkAPI', function(esnRestangular) {
    function create(source, target, type, value) {
      return esnRestangular.all('resource-links').customPOST({
        source: source,
        target: target,
        type: type,
        value: value
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
      return esnRestangular.all('resource-links').customDELETE(null, null, {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*'
      }, {
        source: source,
        target: target,
        type: type
      });
    }

    return {
      create: create,
      remove: remove,
      get: get
    };
  });
