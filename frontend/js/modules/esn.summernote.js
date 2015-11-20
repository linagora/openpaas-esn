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
   * Move the cursor inside a content editable div
   */
  .factory('MoveCursorContentEditable', function($window) {
    function moveCursorFocusedSelection(node, position) {
      var selection = $window.getSelection();
      var range = $window.document.createRange();
      range.setStart(node, position);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    return {
      moveCursorFocusedSelection: moveCursorFocusedSelection
    };
  })

  /**
   * The caret is invisible/placed at wrong place in an empty content-editable node
   * This plugin prevent the content-editable node from being empty.
   * FYI: the minimum content for a content-editable node in summernote to be
   * non-empty is equals to = <p><br></p>, which is called the emptyPara
   * Bug description: https://github.com/summernote/summernote/pull/313
   */
  .factory('PreventEmptyAreaPlugin', function($timeout, MoveCursorContentEditable) {
    function moveCursorBeginningSelectedEditableDiv(layoutInfo) {
      MoveCursorContentEditable.moveCursorFocusedSelection(layoutInfo.editable()[0].childNodes[0], 0);
    }
    return {
      name: 'PreventEmptyArea',
      init: function(layoutInfo) {
        // the timeout is used to invoke the function after the ng-model is linked to the DOM
        $timeout(function() {
          if (layoutInfo.editable().code() === '') {
            layoutInfo.editable().append('<p><br/></p>');
            moveCursorBeginningSelectedEditableDiv(layoutInfo);
          }
        }, 0);

        layoutInfo.holder().on('summernote.change', function(event, node) {
          if (node.indexOf('<br>') === 0 || node === '') {
            layoutInfo.editable().empty();
            layoutInfo.editable().append('<p><br/></p>');
            moveCursorBeginningSelectedEditableDiv(layoutInfo);
          }
        });
      }
    };
  })

  /**
   * This plugin toggles an "empty" class on the contenteditor element of summernote. This class is
   * to be used instead of the pseudo class ":empty" to support placeholder. By doing so,
   * the placeholder could be displayed in two different cases:
   *  A. the editor is really empty "=== :empty"
   *  B. the editor contains some html tags to prevent it from being empty "see PreventEmptyAreaPlugin"
   */
  .factory('SupportPlaceholderPlugin', function() {
    function isContentEditableEmpty(contentEditableCode) {
      return contentEditableCode === '' || contentEditableCode === '<p><br></p>';
    }
    return {
      name: 'SupportPlaceholder',
      init: function(layoutInfo) {
        var contentEditable = layoutInfo.editor().find('[contenteditable="true"]');
        contentEditable.toggleClass('empty', isContentEditableEmpty(layoutInfo.editable().code()));

        layoutInfo.holder().on('summernote.change', function() {
          contentEditable.toggleClass('empty', isContentEditableEmpty(layoutInfo.editable().code()));
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

  .run(function(summernote, FullscreenPlugin, MobileFirefoxNewlinePlugin, PreventEmptyAreaPlugin, SupportPlaceholderPlugin, deviceDetector, BROWSERS) {
    summernote.addPlugin(FullscreenPlugin);
    summernote.addPlugin(SupportPlaceholderPlugin);
    summernote.addPlugin(PreventEmptyAreaPlugin);

    if (deviceDetector.browser === BROWSERS.FIREFOX && deviceDetector.isMobile()) {
      summernote.addPlugin(MobileFirefoxNewlinePlugin);
    }
  });
