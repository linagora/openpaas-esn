'use strict';

angular.module('esn.invitation', ['esn.http', 'esn.form.helper'])
.factory('invitationAPI', function(esnRestangular) {

  function get(id) {
    return esnRestangular.one('invitations', id).get();
  }

  function create(settings) {
    return esnRestangular.all('invitations').post(settings);
  }

  function finalize(id, settings) {
    return esnRestangular.one('invitations', id).customPUT(settings);
  }

  return {
    get: get,
    create: create,
    finalize: finalize
  };
});
