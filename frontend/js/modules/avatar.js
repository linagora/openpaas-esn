'use strict';

angular.module('esn.avatar', []).controller('avatarEdit', function($scope) {

  $scope.error = null;
  $scope.preview = false;

}).factory('selectionService', function($rootScope) {

  var sharedService = {};
  sharedService.image = null;

  sharedService.setImage = function(image) {
    this.image = image;
    $rootScope.$broadcast('crop:loaded');
  };

  sharedService.getImage = function() {
    return this.image;
  };

  sharedService.broadcastSelection = function(x) {
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

