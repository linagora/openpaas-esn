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
  })

  /**
   * Fullscreen button with a custom behavior that can be added
   * to the toolbar of summernote using summernote.addPlugin() method
   */
  .factory('FullscreenPlugin', function($rootScope, summernote) {
    return function(context) {
      context.memo('button.esnFullscreen', function() {
        return summernote.ui.button({
          contents: summernote.ui.icon('fa fa-expand'),
          tooltip: 'Full Screen',
          click: function() {
            context.invoke('fullscreen.toggle');

            angular.element(this)
              .find('i.fa')
              .toggleClass('fa-expand')
              .toggleClass('fa-compress');

            if (context.layoutInfo.editor.hasClass('fullscreen')) {
              $rootScope.$broadcast('header:hide');
            } else {
              $rootScope.$broadcast('header:show');
            }
          }
        }).render();
      });
    };
  })

  .run(function(summernotePlugins, FullscreenPlugin) {
    summernotePlugins.add('esnFullscreen', FullscreenPlugin);
  });
