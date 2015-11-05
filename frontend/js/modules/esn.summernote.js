'use strict';

/**
 * Just to explain:
 *  $.summernote <== frontend/components/summernote/dist/summernote.js
 *  summernote <== frontend/components/angular-summernote/dist/angular-summernote.js
 */
angular.module('esn.summernote-wrapper', ['summernote', 'ng.deviceDetector'])
  .factory('summernote', function() {
    return $.summernote;
  })

  /**
  * Firefox adds a <p> tag when pressing ENTER. The problem is that the tag <p>
  * does not force the cursor to go to a newline in firefox. This plugin is used
  * to change the default behavior of firefox when pressing enter so as to make
  * it adds a <br/> tag for each newline.
  * Bug description and the plugin are provided at:
  * https://github.com/summernote/summernote/issues/702
  */
  .factory('MobileFirefoxNewlinePlugin', function($window) {
    function pasteHtmlAtCaret(newlineHtmlElement) {
      var selection, range;
      if ($window.getSelection) {
        // get the text from the focused content-editable div
        selection = $window.getSelection();
        // put the text in a range for future operations
        range = selection.getRangeAt(0);

        // delete the text from the content-editable div
        range.deleteContents();

        // define the DOM node after which a newline is to be inserted
        var frag = $window.document.createDocumentFragment();
        var newLineNode = frag.appendChild(angular.element(newlineHtmlElement)[0]);

        // append the newline tag to the end of the range
        range.insertNode(frag);

        // insert the modified range again in the content-editable div
        range = range.cloneRange();
        range.setStartAfter(newLineNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    return {
      name: 'MobileFirefoxNewline',
      events: {
        insertParagraph: function(event) {
          pasteHtmlAtCaret('<br/>');
          event.preventDefault();
        }
      }
    };
  })

  /**
   * In firefox, the caret is invisible/placed at wrong place in an empty content
   * -editable node. This plugin prevent the content-editable node from being empty.
   * FYI: the minimum content for a content-editable node in summernote to be
   * non-empty is equals to = <p><br></p>, which is called the emptyPara
   * Bug description: https://github.com/summernote/summernote/pull/313
   */
  .factory('PreventEmptyAreaFirefoxPlugin', function($timeout) {
    return {
      name: 'PreventEmptyAreaFirefox',
      init: function(layoutInfo) {

        // the timeout is used to invoke the function after the ng-model is linked to the DOM
        $timeout(function() {
          if (layoutInfo.editable().code() === '') {
            layoutInfo.editable().append('<p><br/></p>');
          }
        }, 0);

        layoutInfo.holder().on('summernote.change', function(event, node) {
          if (node.indexOf('<br>') === 0 || node === '') {
            layoutInfo.editable().empty();
            layoutInfo.editable().append('<p><br/></p>');
          }
        });
      }
    };
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

  .run(function(summernote, FullscreenPlugin, MobileFirefoxNewlinePlugin, PreventEmptyAreaFirefoxPlugin, deviceDetector) {
    summernote.addPlugin(FullscreenPlugin);

    if (deviceDetector.browser === 'firefox') {
      summernote.addPlugin(PreventEmptyAreaFirefoxPlugin);

      if (deviceDetector.isMobile()) {
        summernote.addPlugin(MobileFirefoxNewlinePlugin);
      }
    }
  });
