'use strict';

/**
 * Just to explain:
 *  $.summernote <== frontend/components/summernote/dist/summernote.js
 *  summernote <== frontend/components/angular-summernote/dist/angular-summernote.js
 */
angular.module('esn.summernote-wrapper', ['summernote', 'ng.deviceDetector', 'esn.scroll'])
  .factory('summernote', function() {
    return $.summernote;
  })

  .factory('summernotePlugins', function(summernote) {
    return {
      add: function(name, plugin) { summernote.plugins[name] = plugin; }
    };
  });
