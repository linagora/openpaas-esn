'use strict';

angular.module('esn.avatar', [
  'esn.constants',
  'mgcrea.ngStrap',
  'ngAnimate',
  'mgcrea.ngStrap.modal',
  'angularFileUpload',
  'mgcrea.ngStrap.alert',
  'ng.deviceDetector',
  'esn.http',
  'esn.url',
  'esn.session'
])
  .constant('AVATAR_OFFSET', 10)
  .provider('avatarDefaultUrl', function() {
    var url = '/images/community.png';

    return {
      set: function(value) {
        url = value || '/images/community.png';
      },
      $get: function() {
        return {
          get: function() {
            return url;
          }
        };
      }
    };
  })
  .provider('jcropExtendOptions', function() {
    var options = {};

    return {
      set: function(value) {
        options = value || {};
      },
      $get: function() {
        return {
          get: function() {
            return options;
          }
        };
      }
    };
  })
  .controller('avatarEdit', function($rootScope, $scope, session, selectionService, avatarAPI, $alert, $modal) {

    selectionService.clear();
    var createModal = $modal({scope: $scope, templateUrl: '/views/modules/avatar/avatar-edit-modal.html', show: false, backdrop: 'static', keyboard: false});
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

      var uploadAvatar = $scope.user._id === session.user._id ?
        avatarAPI.uploadAvatar(blob, mime) :
        avatarAPI.uploadUserAvatar(blob, mime, $scope.user._id, session.domain._id);

      uploadAvatar
        .progress(function(evt) {
          $scope.progress = parseInt(100.0 * evt.loaded / evt.total, 10);
        })
        .success(function() {
          $scope.progress = 100;
          $scope.step = 'redirect';
          $rootScope.$broadcast('avatar:updated', $scope.user);
          done();
        })
        .error(function(error) {
          $scope.progress = 100;
          $scope.step = 'uploadfailed';
          $scope.error = error;
          done();
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

  })
  .factory('avatarAPI', function($upload, httpConfigurer) {
    return {
      uploadAvatar: uploadAvatar,
      uploadUserAvatar: uploadUserAvatar
    };

    function uploadAvatar(blob, mime) {
      return $upload.http({
        method: 'POST',
        url: httpConfigurer.getUrl('/api/user/profile/avatar'),
        headers: {'Content-Type': mime},
        data: blob,
        params: {mimetype: mime, size: blob.size},
        withCredentials: true
      });
    }

    function uploadUserAvatar(blob, mime, userId, domainId) {
      return $upload.http({
        method: 'PUT',
        url: httpConfigurer.getUrl('/api/users/' + userId + '/profile/avatar?domain_id=' + domainId),
        headers: { 'Content-Type': mime },
        data: blob,
        params: { mimetype: mime, size: blob.size },
        withCredentials: true
      });
    }
  })
  .factory('selectionService', function($rootScope, AVATAR_MIN_SIZE_PX) {

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

  })
  .directive('imgPreview', function(selectionService, AVATAR_MIN_SIZE_PX) {

    return {
      restrict: 'A',
      replace: true,
      link: function($scope, element) {
        var canvas = element[0];
        canvas.width = canvas.height = AVATAR_MIN_SIZE_PX / 2;
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
  })
  .directive('imgLoaded', function(selectionService, AVATAR_MIN_SIZE_PX, AVATAR_OFFSET, deviceDetector, jcropExtendOptions) {
    return {
      restrict: 'E',
      scope: {
        optimalSize: '='
      },
      link: function(scope, element) {
        var myImg, myJcropAPI;
        var clear = function() {
          if (myJcropAPI) {
            myJcropAPI.destroy();
            myJcropAPI = null;
          }
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

          var width, height, ratio;
          if (image.width >= image.height) {
            width = scope.optimalSize;
            ratio = image.width / width;
            height = image.height / ratio;
          } else {
            height = scope.optimalSize;
            ratio = image.height / height;
            width = image.width / ratio;
          }

          var minsize = AVATAR_MIN_SIZE_PX / ratio;
          var minSetSelectSizeX = width - AVATAR_OFFSET;
          var minSetSelectSizeY = height - AVATAR_OFFSET;

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

          angular.element(myImg).Jcrop(angular.extend({}, {
            bgColor: 'black',
            bgOpacity: 0.6,
            setSelect: [AVATAR_OFFSET, AVATAR_OFFSET, minSetSelectSizeX, minSetSelectSizeY],
            minSize: [minsize, minsize],
            aspectRatio: 1,
            touchSupport: true,
            onSelect: broadcastSelection,
            onChange: deviceDetector.isDesktop() ? broadcastSelection : function() {}
          }, jcropExtendOptions.get()), function() {
            myJcropAPI = this;
          });

        });
        scope.$on('$destroy', clear);
      }
    };
  })
  .directive('loadButton', function(selectionService, AVATAR_MIN_SIZE_PX, AVATAR_MAX_SIZE_MB) {

    return {
      restrict: 'A',
      replace: true,
      link: function(scope, element) {
        element.bind('change', function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
          selectionService.reset();
          selectionService.clear();
          var file = evt.dataTransfer !== undefined ? evt.dataTransfer.files[0] : evt.target.files[0];
          if (!file || !file.type.match(/^image\//)) {
            selectionService.setError('Wrong file type, please select a valid image');
          } else {
            var megabyte = Math.pow(2, 20);
            if (file.size > AVATAR_MAX_SIZE_MB * megabyte) {
              selectionService.setError('File is too large (maximum size is ' + AVATAR_MAX_SIZE_MB + ' Mb)');
            } else {
              var reader = new FileReader();
              reader.onload = (function() {
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
  })
  .directive('avatarPicker', function(selectionService, $alert, avatarDefaultUrl) {
    function link($scope, element, attrs) {
      $scope.image = {
        selected: false
      };
      $scope.avatarPlaceholder = attrs.avatarPlaceholder ? attrs.avatarPlaceholder : avatarDefaultUrl.get();

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
            container: element.find('.avatar-picker-error'),
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
  })
  .directive('avatarImg', function($timeout) {
    function link(scope) {
      scope.getURL = function() {
        if (scope.avatarUser) {
          return '/api/users/' + scope.avatarUser._id + '/profile/avatar?cb=' + Date.now();
        }

        return '/api/user/profile/avatar?cb=' + Date.now();
      };

      scope.avatarURL = scope.getURL();
      scope.$on('avatar:updated', function() {
        $timeout(function() {
          scope.avatarURL = scope.getURL();
        });
      });
    }

    return {
      restrict: 'E',
      replace: true,
      scope: {
        avatarUser: '=?'
      },
      template: '<img ng-src="{{avatarURL}}" />',
      link: link
    };
  })
  .component('esnAvatar', {
    templateUrl: '/views/modules/avatar/avatar.html',
    controller: 'EsnAvatarController',
    bindings: {
      userId: '<',
      userEmail: '<',
      avatarUrl: '<',
      hideUserStatus: '<',
      noCache: '<',
      resolveAvatar: '&'
    }
  })
  .controller('EsnAvatarController', function($attrs, $q, $log, userAPI, esnAvatarUrlService) {
    var self = this;

    self.$onInit = setProperties;
    self.$onChanges = setProperties;
    self.displayUserStatus = displayUserStatus;
    self.avatar = {};

    function setProperties() {
      if ($attrs.resolveAvatar) {
        return self.resolveAvatar().then(function(avatar) {
          self.avatar = avatar;
        });
      }

      self.avatar = {};

      if (self.userId) {
        self.avatar.id = self.userId;
      }

      if (self.userEmail) {
        self.avatar.email = self.userEmail;
      }

      self.avatar.url = self.avatarUrl || generateAvatarUrl(self.avatar.id, self.avatar.email);

      if (self.userEmail && !self.avatar.id) {
        getUserIdByEmail(self.userEmail).then(function(userId) {
          self.avatar.id = userId;
        });
      }
    }

    function generateAvatarUrl(id, email) {
      if (id) {
        return esnAvatarUrlService.generateUrlByUserId(id, self.noCache);
      }

      if (email) {
        return esnAvatarUrlService.generateUrl(email, self.noCache);
      }
    }

    function getUserIdByEmail(userEmail) {
      return userAPI.getUsersByEmail(userEmail)
        .then(function(response) {
          if (response.data && response.data[0]) {
            return response.data[0]._id;
          }
        });
    }

    function displayUserStatus() {
      return !!self.avatar.id && !self.hideUserStatus;
    }
  });
