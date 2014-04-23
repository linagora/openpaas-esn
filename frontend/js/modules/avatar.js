'use strict';

angular.module('esn.avatar', [])

  .controller('avatarEdit', function($rootScope, $scope, selectionService, avatarAPI) {

    var initUploadContext = function() {
      $scope.error = null;
      $scope.progress = 0;
      $scope.status = 'Upload';
      $scope.uploading = false;
      $scope.$apply();
    };

    $scope.preview = false;

    $scope.upload = function() {

      $scope.uploading = true;
      $scope.status = 'Uploading';
      $scope.progress = 1;

      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = canvas.height = 128;
      context.drawImage(selectionService.getImage(), 0, 0, 128, 128);
      var mime = 'image/png';

      canvas.toBlob(function(blob) {
        avatarAPI.uploadAvatar(blob, mime, function(percent) {
          $scope.progress = percent;
          $scope.$apply();
        }, function(err) {
          $scope.status = 'Upload';
          if (err) {
            $scope.error = 'Error while uploading the avatar';
          }
          $scope.$apply();
          canvas = null;
        });
      }, mime);
    };

    $rootScope.$on('crop:loaded', initUploadContext);
    initUploadContext();

  }).factory('avatarAPI', function() {

    function uploadAvatar(blob, mime, progress, callback) {
      var xhr = new XMLHttpRequest();
      xhr.upload.onprogress = function(event) {
        var p = event.lengthComputable ? event.loaded * 100 / event.total : 0;
        progress(p);
      };

      xhr.onload = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            return callback();
          } else {
            return callback(new Error('Server Side Error (onload)'));
          }
        }
      };

      xhr.onerror = function() {
        return callback(new Error('Server Side Error (onerror)'));
      };

      xhr.open('POST', '/api/user/profile/avatar?mimetype=' + mime + '&size=' + blob.size);
      xhr.withCredentials = true;
      xhr.send(blob);
    }

    return {
      uploadAvatar: uploadAvatar
    };

  }).factory('selectionService', function($rootScope) {

  var sharedService = {};
  sharedService.image = null;
  sharedService.selection = {};

  sharedService.setImage = function(image) {
    this.image = image;
    $rootScope.$broadcast('crop:loaded');
  };

  sharedService.getImage = function() {
    return this.image;
  };

  sharedService.broadcastSelection = function(x) {
    this.selection = x;
    $rootScope.$broadcast('crop:selected', x);
  };

  return sharedService;

}).directive('imgPreview', function(selectionService) {

  return {
    restrict: 'A',
    replace: true,
    link: function($scope, element) {
      $scope.$on('crop:selected', function(context, data) {

        var selection = data.cords;
        var ratio = data.ratio || 1;

        var img = selectionService.getImage();
        var canvas = element[0];
        canvas.width = canvas.height = 128;

        var ctx = canvas.getContext('2d');
        if (selection.w < 128 || selection.h < 128) {
          ctx.drawImage(img, 0, 0, 128, 128);
        } else {
          ctx.drawImage(img, selection.x * ratio, selection.y * ratio, selection.w * ratio, selection.h * ratio, 0, 0, canvas.width, canvas.height);
        }
      });
    }
  };
}).directive('imgLoaded', function(selectionService) {

  return {
    restrict: 'E',
    replace: true,
    scope: {
      width: '='
    },
    link: function(scope, element, attr) {
      var myImg;
      var clear = function() {
        if (myImg) {
          myImg.next().remove();
          myImg.remove();
          myImg = undefined;
        }
      };

      scope.$on('crop:loaded', function() {
        clear();
        var image = selectionService.getImage();
        var canvas = document.createElement('canvas');

        var width = scope.width || 500;
        var height = image.height * (width / image.width);
        var ratio = image.width / width;

        canvas.width = width;
        canvas.height = height;

        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        element.after('<img />');
        myImg = element.next();
        myImg.attr('src', canvas.toDataURL());
        myImg.attr('width', width);
        myImg.attr('height', height);

        $(myImg).Jcrop({
          bgColor: 'black',
          bgOpacity: 0.6,
          setSelect: [0, 0, 128, 128],
          minSize: [128, 128],
          aspectRatio: 1,
          onSelect: function(x) {
            selectionService.broadcastSelection({cords: x, ratio: ratio});
          },
          onChange: function(x) {
            selectionService.broadcastSelection({cords: x, ratio: ratio});
          }
        });

      });
      scope.$on('$destroy', clear);
    }
  };
}).directive('loadButton', function(selectionService) {

    return {
      restrict: 'A',
      replace: true,
      link: function(scope, element, attrs) {
        element.bind('change', function(evt) {
          evt.stopPropagation();
          evt.preventDefault();

          var file = evt.dataTransfer !== undefined ? evt.dataTransfer.files[0] : evt.target.files[0];
          if (!file || !file.type.match(/^image\//)) {
            scope.error = 'Wrong file type, please select a valid image';
            scope.$apply();
          } else {
            scope.preview = true;
            scope.error = null;
            scope.$apply();
            var reader = new FileReader();
            reader.onload = (function(theFile) {
              return function(e) {
                var image = new Image();
                image.src = e.target.result;
                image.onload = function() {
                  selectionService.setImage(image);
                };
              };
            })(file);
            reader.readAsDataURL(file);
          }
        });
      }
    };
  });

