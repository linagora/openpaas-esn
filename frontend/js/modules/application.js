'use strict';

angular.module('esn.application', ['esn.http', 'op.dynamicDirective'])
  .config(function(dynamicDirectiveServiceProvider) {
    var applicationAppMenu = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'application-menu-application', {priority: 5});
    dynamicDirectiveServiceProvider.addInjection('esn-application-menu', applicationAppMenu);

    var applicationControlCenterMenu = new dynamicDirectiveServiceProvider.DynamicDirective(true, 'controlcenter-menu-application', {priority: -10});
    dynamicDirectiveServiceProvider.addInjection('controlcenter-sidebar-menu', applicationControlCenterMenu);
  })
  .controller('applicationController', function($scope, $log, $location, applicationAPI, applications) {
    $scope.applications = applications;
    $scope.sending = false;
    $scope.client = {};

    $scope.create = function(client) {
      if (!client) {
        $log.error('Client is required');
        return;
      }
      $scope.sending = true;
      applicationAPI.create(client).then(function(response) {
        $log.debug('Successfully created new client', client, response);
        $location.path('/applications/' + response.data._id);
      }, function(err) {
        $log.error('Error while creating new client', err.data);
        $scope.sending = false;
      });
    };
  })
  .controller('applicationDetailsController', function($scope, $log, applicationAPI, application) {
    $scope.client = application;
    $scope.sending = false;

    $scope.revokeTokens = function() {
      $log.debug('Revoke tokens for client', $scope.client);
    };
    $scope.resetClientSecret = function() {
      $log.debug('Reset client secret for client', $scope.client);
    };
    $scope.update = function() {
      $log.debug('Update client', $scope.client);
    };
    $scope.delete = function() {
      $log.debug('Delete client', $scope.client);
    };
  })
  .directive('applicationDisplay', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/application/application-display.html'
    };
  })
  .directive('applicationAddForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/application/application-add-form.html'
    };
  })
  .directive('applicationEditForm', function() {
    return {
      restrict: 'E',
      templateUrl: '/views/modules/application/application-edit-form.html'
    };
  })
  .directive('applicationMenuApplication', function(applicationMenuTemplateBuilder) {
    return {
      retrict: 'E',
      replace: true,
      template: applicationMenuTemplateBuilder('/#/applications', 'mdi-apps', 'Applications', 'core.applications-menu.applications')
    };
  })
  .directive('controlcenterMenuApplication', function(controlCenterMenuTemplateBuilder) {
    return {
      retrict: 'E',
      template: controlCenterMenuTemplateBuilder('/#/applications', 'mdi-apps', 'Applications')
    };
  })
  .factory('applicationAPI', function(esnRestangular) {

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

    return {
      list: list,
      get: get,
      create: create,
      created: created,
      remove: remove
    };
  });
