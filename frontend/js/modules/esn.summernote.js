'use strict';

/**
 * Just to explain:
 *  $.summernote <== frontend/components/summernote/dist/summernote.js
 *  summernote <== frontend/components/angular-summernote/dist/angular-summernote.js
 */
angular.module('esn.summernote-wrapper', ['summernote', 'ng.deviceDetector', 'esn.scroll', 'esn.i18n'])
  .factory('summernote', function(esnI18nService) {
    return esnI18nService.getFullLocale(function(fullLocale) {
      $.summernote.options.lang = fullLocale;

      return $.summernote;
    });

  })

  .factory('summernotePlugins', function(summernote) {
    return {
      add: function(name, plugin) { summernote.plugins[name] = plugin; }
    };
  });
