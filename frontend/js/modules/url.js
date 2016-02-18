'use strict';

angular.module('esn.url', ['esn.ui'])

  .factory('urlUtils', function($window) {

    // Add / Update a key-value pair in the URL query parameters
    // Thank to http://stackoverflow.com/questions/5999118/add-or-update-query-string-parameter
    function updateUrlParameter(uri, key, value) {
      value = $window.encodeURIComponent(value);
      // remove the hash part before operating on the uri
      var i = uri.indexOf('#');
      var hash = i === -1 ? '' : uri.substr(i);
      uri = i === -1 ? uri : uri.substr(0, i);

      var re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
      var separator = uri.indexOf('?') !== -1 ? '&' : '?';
      if (re.test(uri)) {
        uri = uri.replace(re, '$1' + key + '=' + value + '$2');
      } else {
        uri = uri + separator + key + '=' + value;
      }
      return uri + hash; // finally append the hash as well
    }

    return {
      updateUrlParameter: updateUrlParameter
    };

  })

  .factory('absoluteUrl', function(createHtmlElement) {
    return function(url) {
      return createHtmlElement('a', { href: url }).href;
    };
  });
