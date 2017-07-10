'use strict';

(function() {

    var provider = {
        name: 'image',
        contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
    };
    angular.module('esn.file-preview.image', ['esn.file-preview'])
        .run(function(filePreviewService) {
            filePreviewService.addFilePreviewProvider(provider);
        })
        .directive('filePreviewImage', function() {
            return {
                restrict: 'E',
                scope: {
                    file: '='
                },
                templateUrl: '/views/modules/file-preview/file-preview-image.html'
            };
        })
        .directive('imageViewer', function() {
            return {
                restrict: 'E',
                scope: {
                    file: '=targetFile'
                },
                controller: ['$scope', '$window', function($scope, $window) {
                    $scope.image = {
                        path: "",
                        width: 0,
                        height: 0
                    }
                    var img = new Image();
                    img.onload = function() {
                        $scope.$apply(function() {
                            $scope.image.width = img.width;
                            $scope.image.height = img.height;
                            $scope.image.path = '/api/files/'+$scope.file._id;
                            if ($scope.image.width > 800) {
                                $scope.image.width = 0.7 * $(window).width();
                            }
                            $scope.modalDialogStyle = {
                                'width': $scope.image.width
                            };
                            $scope.imgStyle = {
                                'max-height':'100%'
                            };
                        });
                    }
                    img.src = '/api/files/'+$scope.file._id;
                }],
                templateUrl: '/views/modules/file-preview/image-viewer.html'
            };
        });
})();
