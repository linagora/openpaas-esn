'use strict';

angular.
	module('esn.attachment').
	directive('esnImageViewer', function() {
	  return {
      restrict: 'E',
      scope: {
        file: '='
      },
      controller: function($scope, $window) {
        $scope.image = {
          path: "",
          width: 0,
          heit: 0
        }
        var img = new Image();
        img.onload = function() {
          $scope.image.width = img.width;
          $scope.image.height = img.height;
          $scope.image.path = '/api/files/' + $scope.file._id;
          if ($scope.image.width > 800) {
            $scope.image.width = 0.7 * $(window).width();
          }
          $scope.modalDialogStyle = {
            'width': $scope.image.width
          };
          $scope.imgStyle = {
            'max-height': '100%'
          };
        }
        img.src = '/api/files/' + $scope.file._id;
        $scope.imgStyle = {
            'max-height': '100%',
            'width':'600px'
          };
      },
      templateUrl: '/views/modules/attachment/viewer/image-viewer/image-viewer.html'
    };
});
