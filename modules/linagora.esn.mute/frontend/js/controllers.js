'use strict';

angular.module('linagora.esn.mute')
  .controller('muteController', function($scope, $sce, Restangular) {

      Restangular.withConfig(function(RestangularConfigurer) {
        RestangularConfigurer.setBaseUrl('/mute/api');
        RestangularConfigurer.setFullResponse(true);
      }).one('config').get().then(function(response) {
        console.log('response', response.data.url);
        $scope.editorUrl = $sce.trustAsResourceUrl(response.data.url);
      })

  });
