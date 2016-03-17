'use strict';

angular.module('linagora.esn.mute')
  .controller('muteIframeController', function($scope, $sce, Restangular, $stateParams) {

      Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/mute/api');
        RestangularConfigurer.setFullResponse(true);
      }).one('config').get().then(function(response) {
        console.log('response', response.data.url);
        $scope.editorUrl = $sce.trustAsResourceUrl(response.data.url + $stateParams.id);
      })

  })
  
  .controller('muteController', function($scope, $state) {
    $scope.goToDocument = function() {
      $state.go('mutedocument', { id: $scope.document.name });
    };
  });
