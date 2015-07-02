'use strict';

angular.module('esn.avatar', ['mgcrea.ngStrap', 'ngAnimate', 'mgcrea.ngStrap.modal', 'angularFileUpload', 'mgcrea.ngStrap.alert', 'ng.deviceDetector'])
  .constant('AVATAR_MIN_SIZE_PX', 128)
  .controller('avatarEdit', function($rootScope, $scope, selectionService, avatarAPI, $alert, $modal) {

    selectionService.clear();
    var createModal = $modal({scope: $scope, template: '/views/modules/profile/avatar-edit-modal.html', show: false, backdrop: 'static', keyboard: false});
    var alertInstance;

    function destroyAlertInstance() {
      if (alertInstance) {
        alertInstance.destroy();
        alertInstance = null;
      }
    }

    $scope.showAvatarEditModal = function() {
      $scope.initUploadContext();
      createModal.$promise.then(createModal.show);
    };

    $scope.initUploadContext = function() {
      $scope.uploadError = false;
      $scope.progress = 0;
      $scope.status = 'Upload';
      $scope.uploading = false;
      $scope.step = 'none';
      $scope.preview = false;
    };

    $scope.preview = false;

    function done() {
      $scope.uploading = false;
      if (createModal) {
        createModal.hide();
      }
      selectionService.clear();
    }

    $scope.send = function(blob, mime) {
      $scope.uploading = true;
      $scope.step = 'uploading';

      avatarAPI.uploadAvatar(blob, mime)
        .progress(function(evt) {
          var value = parseInt(100.0 * evt.loaded / evt.total);
          $scope.progress = value;
        })
        .success(function() {
          $scope.progress = 100;
          $scope.step = 'redirect';
          $rootScope.$broadcast('avatar:updated');
          return done();
        })
        .error(function(error) {
          $scope.progress = 100;
          $scope.step = 'uploadfailed';
          $scope.error = error;
          return done();
        });
    };

    $scope.upload = function() {

      $scope.uploading = true;
      $scope.status = 'Uploading';
      $scope.progress = 1;
      var mime = 'image/png';
      selectionService.getBlob(mime, function(blob) {
        $scope.send(blob, mime);
      });
    };

    $scope.$on('crop:loaded', function() {
      destroyAlertInstance();
      $scope.initUploadContext();
      $scope.preview = true;
      $scope.$apply();
    });

    $scope.$on('crop:error', function(context, error) {
      destroyAlertInstance();
      if (error) {
        alertInstance = $alert({
          title: 'Error',
          content: error,
          type: 'danger',
          show: true,
          position: 'bottom',
          container: '#edit-avatar-dialog .error',
          animation: 'am-fade'
        });
      }
    });

    $scope.$on('crop:reset', function() {
      destroyAlertInstance();
      selectionService.clear();
    });

    $scope.initUploadContext();

  }).factory('avatarAPI', function($upload) {

    function uploadAvatar(blob, mime) {
      return $upload.http({
        method: 'POST',
        url: '/api/user/profile/avatar',
        headers: {'Content-Type': mime},
        data: blob,
        params: {mimetype: mime, size: blob.size},
        withCredentials: true
      });
    }

    return {
      uploadAvatar: uploadAvatar
    };

  }).factory('selectionService', ['$rootScope', 'AVATAR_MIN_SIZE_PX', function($rootScope, AVATAR_MIN_SIZE_PX) {

  var sharedService = {};
  sharedService.image = null;
  sharedService.selection = {};
  sharedService.error = null;

  sharedService.setImage = function(image) {
    this.image = image;
    $rootScope.$broadcast('crop:loaded');
  };

  sharedService.getImage = function() {
    return this.image;
  };

  sharedService.getError = function() {
    return this.error;
  };

  sharedService.setError = function(error) {
    this.error = error;
    $rootScope.$broadcast('crop:error', error);
  };

  sharedService.reset = function() {
    $rootScope.$broadcast('crop:reset');
  };

  sharedService.broadcastSelection = function(x) {
    this.selection = x;
    $rootScope.$broadcast('crop:selected', x);
  };

  sharedService.computeCanvasSelection = function computeCanvasSelection(img, ratio, selection) {
    var w = selection.w * ratio;
    if (w > img.naturalWidth) {
      w = img.naturalWidth;
    }
    var h = selection.h * ratio;
    if (h > img.naturalHeight) {
      h = img.naturalHeight;
    }
    return {
      x: selection.x * ratio,
      y: selection.y * ratio,
      w: w,
      h: h
    };
  };

  sharedService.getBlob = function getBlob(mime, callback) {
    var canvas = document.createElement('canvas');
    canvas.width = AVATAR_MIN_SIZE_PX;
    canvas.height = AVATAR_MIN_SIZE_PX;

    var context = canvas.getContext('2d');
    var image = sharedService.getImage();
    var ratio = sharedService.selection.ratio || 1;
    var selection = sharedService.selection.cords;
    if (selection.w === 0 || selection.h === 0) {
      context.drawImage(image, 0, 0, AVATAR_MIN_SIZE_PX, AVATAR_MIN_SIZE_PX);
    } else {
      var canvasSelection = sharedService.computeCanvasSelection(image, ratio, selection);
      context.drawImage(image, canvasSelection.x, canvasSelection.y, canvasSelection.w, canvasSelection.h, 0, 0, canvas.width, canvas.height);
    }
    canvas.toBlob(callback, mime);
  };

  sharedService.clear = function() {
    sharedService.image = null;
    sharedService.selection = {};
    sharedService.error = null;
  };

  return sharedService;

}]).directive('imgPreview', ['selectionService', 'AVATAR_MIN_SIZE_PX', function(selectionService, AVATAR_MIN_SIZE_PX) {

  return {
    restrict: 'A',
    replace: true,
    link: function($scope, element) {
      var canvas = element[0];
      canvas.width = canvas.height = AVATAR_MIN_SIZE_PX;
      var ctx = canvas.getContext('2d');
      $scope.$on('crop:reset', function() {
        canvas.width = canvas.width;
      });
      $scope.$on('crop:selected', function(context, data) {
        var selection = data.cords;
        var ratio = data.ratio || 1;
        var img = selectionService.getImage();

        canvas.width = canvas.width;
        if (Math.round(selection.w * ratio) < AVATAR_MIN_SIZE_PX || Math.round(selection.h * ratio) < AVATAR_MIN_SIZE_PX) {
          ctx.drawImage(img, 0, 0, AVATAR_MIN_SIZE_PX, AVATAR_MIN_SIZE_PX);
        } else {
          var canvasSelection = selectionService.computeCanvasSelection(img, ratio, selection);
          ctx.drawImage(img, canvasSelection.x, canvasSelection.y, canvasSelection.w, canvasSelection.h, 0, 0, canvas.width, canvas.height);
        }
      });
    }
  };
}]).directive('imgLoaded', ['selectionService', 'AVATAR_MIN_SIZE_PX', 'deviceDetector', function(selectionService, AVATAR_MIN_SIZE_PX, deviceDetector) {

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

      scope.$on('crop:reset', clear);
      scope.$on('crop:loaded', function() {
        clear();
        var image = selectionService.getImage();
        var canvas = document.createElement('canvas');

        var width = scope.width || 380;
        var height = image.height * (width / image.width);
        var ratio = image.width / width;
        var minsize = AVATAR_MIN_SIZE_PX / ratio;
        canvas.width = width;
        canvas.height = height;

        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        element.after('<img />');
        myImg = element.next();
        myImg.attr('src', canvas.toDataURL());
        myImg.attr('width', width);
        myImg.attr('height', height);

        var broadcastSelection = function(x) {
          selectionService.broadcastSelection({cords: x, ratio: ratio});
        };

        $(myImg).Jcrop({
          bgColor: 'black',
          bgOpacity: 0.6,
          setSelect: [0, 0, minsize, minsize],
          minSize: [minsize, minsize],
          aspectRatio: 1,
          touchSupport: true,
          onSelect: broadcastSelection,
          onChange: deviceDetector.isDesktop() ? broadcastSelection : function(x) {}
        });

      });
      scope.$on('$destroy', clear);
    }
  };
}]).directive('loadButton', ['selectionService', 'AVATAR_MIN_SIZE_PX', function(selectionService, AVATAR_MIN_SIZE_PX) {

    return {
      restrict: 'A',
      replace: true,
      scope: {
        maxSize: '='
      },
      link: function(scope, element, attrs) {
        element.bind('change', function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
          selectionService.reset();
          var file = evt.dataTransfer !== undefined ? evt.dataTransfer.files[0] : evt.target.files[0];
          if (!file || !file.type.match(/^image\//)) {
            selectionService.setError('Wrong file type, please select a valid image');
          } else {
            var maxSize = scope.maxSize || 10;
            if (file.size > maxSize * 1048576) {
              selectionService.setError('File is too large (maximum size is ' + scope.maxSize + ' Mb)');
            } else {
              var reader = new FileReader();
              reader.onload = (function(theFile) {
                return function(e) {
                  var image = new Image();
                  image.src = e.target.result;
                  image.onload = function() {
                    var imgHeight = image.naturalHeight,
                        imgWidth = image.naturalWidth;
                    if (imgHeight < AVATAR_MIN_SIZE_PX || imgWidth < AVATAR_MIN_SIZE_PX) {
                      selectionService.setError('This image is too small, please select a picture with a minimum size of ' +
                                                AVATAR_MIN_SIZE_PX + 'x' + AVATAR_MIN_SIZE_PX + 'px');
                    } else {
                      selectionService.setError();
                      selectionService.setImage(image);
                    }
                  };
                };
              })(file);
              reader.readAsDataURL(file);
            }
          }
        });
      }
    };
}])
.directive('avatarPicker', ['selectionService', '$alert', function(selectionService, $alert) {
  function link($scope, element, attrs) {
    $scope.image = {
      selected: false
    };
    $scope.avatarPlaceholder = attrs.avatarPlaceholder ? attrs.avatarPlaceholder : '/images/community.png';

    var alertInstance = null;
    function destroyAlertInstance() {
      if (alertInstance) {
        alertInstance.destroy();
        alertInstance = null;
      }
    }


    $scope.removeSelectedImage = function() {
      selectionService.clear();
      $scope.image.selected = false;
    };

    $scope.$on('crop:loaded', function() {
      destroyAlertInstance();
      $scope.image.selected = true;
      $scope.$apply();
    });

    $scope.$on('crop:error', function(context, error) {
      if (error) {
        alertInstance = $alert({
          title: '',
          content: error,
          type: 'danger',
          show: true,
          position: 'bottom',
          container: element.find('.row.error'),
          animation: 'am-fade'
        });
      }
    });

  }

  return {
    scope: {},
    restrict: 'E',
    templateUrl: '/views/modules/avatar/avatar-picker.html',
    link: link
  };
}]);
