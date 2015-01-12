'use strict';

angular.module('esn.appstore')
  .factory('AppstoreRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/appstore/api');
      RestangularConfigurer.setFullResponse(true);
    });
  })
  .factory('disableService', function() {
    function disableFn(target, array) {
      if (!array || !array.length) {
        return false;
      }
      return array.some(function(element) {
        var targetToCompare = element.target || element;
        return angular.equals(targetToCompare, target);
      });
    }
    return disableFn;
  })
  .factory('appstoreAPI', ['AppstoreRestangular', 'fileAPIService', function(AppstoreRestangular, fileAPIService) {

    function get(id) {
      return AppstoreRestangular.one('apps', id).get();
    }

    function list(query) {
      return AppstoreRestangular.all('apps').getList(query);
    }

    function create(application) {
      return AppstoreRestangular.all('apps').post(application);
    }

    function deploy(id, target, version) {
      var body = { target: target, version: version };
      return AppstoreRestangular.one('apps', id).one('deploy').customPUT(body);
    }

    function updeploy() {
      throw new Error('Not implemented yet');
    }

    function undeploy(id, target) {
      return AppstoreRestangular.one('apps', id).one('undeploy').customPUT(target);
    }

    function install(id, target) {
      return AppstoreRestangular.one('apps', id).one('install').customPUT(target);
    }

    function uninstall(id, target) {
      return AppstoreRestangular.one('apps', id).one('uninstall').customPUT(target);
    }

    function uploadAvatar(id, blob, mime) {
      var url = '/appstore/api/apps/' + id + '/avatar';
      return fileAPIService.upload(url, blob, mime, blob.size);
    }

    function uploadArtifact(id, file, version) {
      var url = '/appstore/api/apps/' + id + '/artifact';
      return fileAPIService.uploadFile(url, file, file.type, file.size, {version: version});
    }

    return {
      create: create,
      list: list,
      get: get,
      deploy: deploy,
      updeploy: updeploy,
      undeploy: undeploy,
      install: install,
      uninstall: uninstall,
      uploadAvatar: uploadAvatar,
      uploadArtifact: uploadArtifact
    };
  }]);
