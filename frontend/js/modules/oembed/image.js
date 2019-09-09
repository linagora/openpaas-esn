'use strict';

(function() {
  var image = angular.module('esn.oembed.image', ['esn.oembed']);

  var provider = {
    name: 'image',
    regexps: [new RegExp(/(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*\.(?:jpe?g|gif|png))(?:\?([^#]*))?(?:(.*))?/i)],
    resolver: 'local'
  };

  image.run(function(oembedRegistry) {
    oembedRegistry.addProvider(provider);
  });

  image.directive('imageOembed', function(oembedResolver, oembedService, $compile) {
    return {
      restrict: 'E',
      replace: true,
      template: '<div class="attachment"></div>',
      scope: {
        url: '@',
        maxwidth: '=',
        maxheight: '='
      },
      link: function($scope, $element) {
        var url = provider.regexps[0].exec($scope.url);
        var imageUrl = url[1] + '://' + url[2] + url[3];

        var html = '<a href="' + imageUrl + '" target="_blank">';
        html += '<img src="' + imageUrl + '" class="img-responsive attachments"/>';
        html += '</a>';

        var element = angular.element(html);
        var e = $compile(element)($scope);
        $element.append(e);
      }
    };
  });

  image.filter('oembedImageFilter', oembedImage);

  function oembedImage() {

    function oembedImageFilter(value) {
      var prepareText = value;
      var text = provider.regexps[0].exec(value);

      if (text) {
        prepareText = text[1] + '://' + text[2] + text[3];
        if (text[5]) {
          prepareText += ' ' + text[5];
        }
      }

      return prepareText;
    }

    return oembedImageFilter;
  }

})();
