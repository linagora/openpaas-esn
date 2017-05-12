(function() {
  'use strict';

  angular.module('esn.oauth-application')
    .factory('ESNOauthApplicationClient', ESNOauthApplicationClient);

  function ESNOauthApplicationClient(esnRestangular) {
    return {
      list: list,
      get: get,
      create: create,
      created: created,
      remove: remove
    };

    function get(id) {
      return esnRestangular.one('oauth/clients', id).get();
    }

    function create(client) {
      return esnRestangular.all('oauth/clients').post(client);
    }

    function list() {
      return esnRestangular.all('oauth/clients').getList();
    }

    function remove(id) {
      return esnRestangular.one('oauth/clients', id).remove();
    }

    function created() {
      return esnRestangular.one('user/oauth/clients').getList();
    }
  }
})();
