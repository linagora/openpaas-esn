'use strict';

angular.module('esn.image', [])
  .factory('imageCacheService', function() {
    var cache = {};
    cache.image = null;

    cache.setImage = function(image) {
      this.image = image;
    };

    cache.getImage = function() {
      return this.image;
    };

    cache.clear = function() {
      cache.image = null;
    };

    return cache;
  })
  .directive('localImagePreview', ['$window', 'imageCacheService', function($window, imageCacheService) {
    var helper = {
      support: !!($window.FileReader && $window.CanvasRenderingContext2D),
      isFile: function(item) {
        return angular.isObject(item) && item instanceof $window.File;
      },
      isImage: function(file) {
        var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
      }
    };

    return {
      restrict: 'E',
      template: '<canvas/>',
      link: function(scope, element, attributes) {

        var canvas = element.find('canvas');
        canvas.attr({width: 0, height: 0});

        function onLoadImage(load) {
          var img = load.target;
          var width = attributes.width || img.width / img.height * attributes.height;
          var height = attributes.height || img.height / img.width * attributes.width;
          canvas.attr({ width: width, height: height });
          canvas[0].getContext('2d').drawImage(img, 0, 0, width, height);
          imageCacheService.setImage(img);
        }

        function onLoadFile(event) {
          var img = new Image();
          img.onload = onLoadImage;
          img.src = event.target.result;
        }

        scope.$watch(attributes.file, function(newValue, oldValue) {

          if (newValue === oldValue) {
            return;
          }

          if (!helper.support) {
            return;
          }

          if (!helper.isFile(newValue)) {
            return;
          }

          if (!helper.isImage(newValue)) {
            return;
          }

          var reader = new FileReader();
          reader.onload = onLoadFile;
          reader.readAsDataURL(newValue);
        });
      }
    };
  }])
  .directive('loadLocalImageButton', function() {
    return {
      restrict: 'A',
      replace: true,
      link: function(scope, element, attrs) {
        console.load(attrs);
        console.log('DIRSCOPE', scope);
        element.bind('change', function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
          var file = evt.dataTransfer !== undefined ? evt.dataTransfer.files[0] : evt.target.files[0];
          scope.image = file;
          scope.$apply();
        });
      }
    };
  });
