'use strict';

/**
 * Just to explain:
 *  $.summernote <== frontend/components/summernote/dist/summernote.js
 *  summernote <== frontend/components/angular-summernote/dist/angular-summernote.js
 */
angular.module('esn.summernote-wrapper', ['summernote'])
  .factory('summernote', function() {
    return $.summernote;
  })

  /**
   * Fullscreen button with a custom behavior that can be added
   * to the toolbar of summernote using summernote.addPlugin() method
   */
  .factory('FullscreenPlugin', function($rootScope, summernote) {
    var tmpl = summernote.renderer.getTemplate();
    return {
      name: 'fullscreen',

      buttons: {
        fullscreen: function() {
          return tmpl.iconButton('fa fa-expand', {
            event: 'fullscreen',
            title: 'Full Screen'
          });
        }
      },

      events: {
        fullscreen: function(event, editor, layoutInfo) {
          summernote.eventHandler.invoke('fullscreen.toggle', layoutInfo);

          var iconElement = layoutInfo.toolbar().find('[data-name="fullscreen"] > i');
          iconElement
            .toggleClass('fa-expand')
            .toggleClass('fa-compress');
          if (layoutInfo.editor().hasClass('fullscreen')) {
            $rootScope.$broadcast('header:hide');
          } else {
            $rootScope.$broadcast('header:show');
          }
        }
      }
    };
  })

  .run(function(summernote, FullscreenPlugin) {
    summernote.addPlugin(FullscreenPlugin);
  });
