'use strict';

angular.module('linagora.esn.mute')
  .controller('muteIframeController', function ($scope, $sce, $stateParams, Restangular, iFrameResize) {

    Restangular.withConfig(function (RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/mute/api');
      RestangularConfigurer.setFullResponse(true);
    }).one('config').get().then(function (response) {
      $scope.editorUrl = $sce.trustAsResourceUrl(response.data.url + $stateParams.id);
    })

  })

  .controller('muteController', function ($scope, $state) {
    $scope.goToDocument = function () {
      $state.go('mutedocument', { id: $scope.document.name });
    };
  });
