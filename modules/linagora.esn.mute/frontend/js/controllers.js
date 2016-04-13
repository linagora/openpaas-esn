'use strict';

angular.module('linagora.esn.mute')
  .controller('muteIframeController', function ($scope, $sce, $stateParams, Restangular, session) {

    Restangular.withConfig(function (RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/mute/api');
      RestangularConfigurer.setFullResponse(true);
    }).one('config').get().then(function (response) {
      $scope.editorUrl = $sce.trustAsResourceUrl(response.data.url + $stateParams.id + '?' + session.user.firstname);
    });

  })

  .controller('muteController', function ($scope, $state) {
    $scope.goToDocument = function () {
      $state.go('mutedocument', { id: $scope.document.name });
    };
  });
