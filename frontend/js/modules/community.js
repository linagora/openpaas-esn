'use strict';

angular.module('esn.community', ['esn.session', 'restangular', 'mgcrea.ngStrap.alert'])
  .factory('communityAPI', ['Restangular', function(Restangular) {

    function list() {
      return Restangular.all('communities').getList();
    }

    function get(id) {
      return Restangular.one('communities', id).get();
    }

    function del(id) {
      return Restangular.one('communities', id).remove();
    }

    function create(body) {
      return Restangular.all('communities').post(body);
    }

    return {
      list: list,
      get: get,
      del: del,
      create: create
    };
  }])
  .controller('communityCreateController', ['$scope', '$location', '$log', '$alert', 'session', 'communityAPI', function($scope, $location, $log, $alert, session, communityAPI) {
    $scope.sending = false;
    $scope.community = {
      domain_ids: [session.domain._id]
    };

    $scope.alert = undefined;

    $scope.displayError = function(err) {
      $scope.alert = $alert({
        content: err,
        type: 'danger',
        show: true,
        position: 'bottom',
        container: '#communityerror'
      });
    };

    $scope.create = function(community) {
      $scope.sending = true;

      if ($scope.alert) {
        $scope.alert.hide();
      }

      if (!community) {
        $log.error('Missing community');
        return $scope.displayError('Community information is missing');
      }

      if (!community.title) {
        $log.error('Missing community title');
        return $scope.displayError('Community title is missing');
      }

      if (!community.domain_ids || community.domain_ids.length === 0) {
        $log.error('Missing community domain');
        return $scope.displayError('Domain is missing, try reloading the page');
      }

      communityAPI.create(community).then(
        function(data) {
          $scope.sending = false;
          $location.path('/communities/' + data.data._id);
        },
        function(err) {
          $scope.sending = false;
          $log.error('Error ', err);
          return $scope.displayError(err.data || err);
        }
      );
    };
  }])
  .directive('communityCreateForm', function() {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/views/modules/community/community-create-form.html'
    };
  });
