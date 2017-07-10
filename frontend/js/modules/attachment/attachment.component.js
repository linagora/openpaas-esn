(function() {
    'use strict';

    angular.module('esn.attachment')
        .component('esnAttachment', esnAttachment())
        .directive('esnAttachmentViewerVideo', function() {
            return {
                scope: {
                    file: '='
                },
                controller: ['$scope',function($scope) {
                    $scope.videoUrl = '/api/files/'+$scope.file._id;
                }],
                link: function(scope, element, attrs){
                    var modal = element.find('.modal');
                    var video = element.find('video');
                    modal.on('hidden.bs.modal', function () {
                       video[0].pause();
                    });
                },
                templateUrl: '/views/modules/attachment/attachment-viewer-video.html'
            };
        });

    function esnAttachment() {
        return {
            bindings: {
                attachment: '='
            },
            controllerAs: 'ctrl',
            templateUrl: '/views/modules/attachment/attachment.html'
        };
    }

})();
