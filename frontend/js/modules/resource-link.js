'use strict';

angular.module('esn.resource-link', ['esn.http'])
  .factory('ResourceLinkAPI', ResourceLinkAPI);

function ResourceLinkAPI(esnRestangular) {

  function create(source, target, type) {
    return esnRestangular.all('resource-links').customPOST({
      source: source,
      target: target,
      type: type
    });
  }

  return {
    create: create
  };
}
