'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.summernote Angular module', function() {
  var $compile, $rootScope, $scope, element;

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  function compileDirective(html) {
    element = $compile(html)($scope);
    $scope.$digest();
    element.appendTo(document.body);
    return element;
  }

  describe('the fullscreen plugin', function() {
    beforeEach(function() {
      angular.mock.module('esn.summernote-wrapper');
      angular.mock.inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
      });
    });

    it('should broadcast a hide/show in alternance while toggling the icon every time the fullscreen button of summernote toolbar is clicked', function() {
      var hide = sinon.spy(), show = sinon.spy();
      $scope.$on('header:hide', function() {
        hide();
      });
      $scope.$on('header:show', function() {
        show();
      });
      var element = compileDirective('<summernote/>');
      element.summernote('focus');
      var btn = angular.element('[data-name="fullscreen"]');
      var icon = angular.element('[data-name="fullscreen"] > i');
      btn.click();
      expect(hide).to.be.called;
      expect(icon.hasClass('fa-compress')).to.be.true;
      expect(icon.hasClass('fa-expand')).to.be.false;
      btn.click();
      expect(show).to.be.called;
      expect(icon.hasClass('fa-compress')).to.be.false;
      expect(icon.hasClass('fa-expand')).to.be.true;
    });
  });

  describe('the MobileFirefoxNewline plugin', function() {
    var $window, MobileFirefoxNewlinePlugin, preventDefaultSpy, event;

    beforeEach(function() {
      preventDefaultSpy = sinon.spy();
      event = {
        preventDefault: preventDefaultSpy
      };

      angular.mock.module('esn.summernote-wrapper');
      angular.mock.inject(function(_$compile_, _$window_, _$rootScope_, _MobileFirefoxNewlinePlugin_) {
        $compile = _$compile_;
        $window = _$window_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        MobileFirefoxNewlinePlugin = _MobileFirefoxNewlinePlugin_;
      });
    });

    function moveCursorInFocesedSelection(node, position) {
      var selection = $window.getSelection();
      var range = $window.document.createRange();
      range.setStart(node, position);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    it('should insert a <br> tag', function() {
      var contentEditable = compileDirective('<div contenteditable="true">Hello world!</div>');
      contentEditable.focus();
      MobileFirefoxNewlinePlugin.events.insertParagraph(event);
      expect(preventDefaultSpy).to.be.called;
      expect(contentEditable.code()).to.equal('<br>Hello world!');
    });

    it('should insert a <br> tag at the current cursor position', function() {
      var contentEditable = compileDirective('<div contenteditable="true">The first line The second line</div>');
      contentEditable.focus();
      // move the cursor to be after "The first line"
      moveCursorInFocesedSelection(contentEditable[0].childNodes[0], 14);

      MobileFirefoxNewlinePlugin.events.insertParagraph(event);
      expect(preventDefaultSpy).to.be.called;
      expect(contentEditable.code()).to.equal('The first line<br> The second line');
    });

    it('should insert a <br> tag at end of a paragraph', function() {
      var contentEditable = compileDirective('<div contenteditable="true"><pr>The first line</pr><p>The second line</p></div>');
      contentEditable.focus();
      // move the cursor to the end of the second paragraph
      moveCursorInFocesedSelection(contentEditable[0].childNodes[1], 1);

      MobileFirefoxNewlinePlugin.events.insertParagraph(event);
      expect(preventDefaultSpy).to.be.called;
      expect(contentEditable.code()).to.equal('<pr>The first line</pr><p>The second line<br></p>');
    });

    it('should insert a <br> tag inside a paragraph', function() {
      var contentEditable = compileDirective('<div contenteditable="true"><pr>The first line</pr><p>The second lineThe third line</p></div>');
      contentEditable.focus();
      // set the cursor between "The second line" and "The third line"
      moveCursorInFocesedSelection(contentEditable[0].childNodes[1].childNodes[0], 15);

      MobileFirefoxNewlinePlugin.events.insertParagraph(event);
      expect(preventDefaultSpy).to.be.called;
      expect(contentEditable.code()).to.equal('<pr>The first line</pr><p>The second line<br>The third line</p>');
    });
  });

  describe('the MobileFirefoxNewline plugin for a non-supported browser', function() {
    var MobileFirefoxNewlinePlugin, preventDefaultSpy, event;

    beforeEach(function() {
      preventDefaultSpy = sinon.spy();
      event = {
        preventDefault: preventDefaultSpy
      };

      angular.mock.module('esn.summernote-wrapper', function($provide) {
        $provide.value('$window', {
          getSelection: undefined,
          navigator: {
            userAgent: 'mobile'
          }
        });

        $provide.value('$document', [{
          documentMode: {}
        }]);
      });

      angular.mock.inject(function(_$compile_, _$rootScope_, _MobileFirefoxNewlinePlugin_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        MobileFirefoxNewlinePlugin = _MobileFirefoxNewlinePlugin_;
      });
    });

    it('should not modify the content editable div', function() {
      var contentEditable = compileDirective('<div contenteditable="true">Hello world!</div>');
      contentEditable.focus();
      MobileFirefoxNewlinePlugin.events.insertParagraph(event);
      expect(preventDefaultSpy).to.be.called;
      expect(contentEditable.code()).to.equal('Hello world!');
    });
  });

  describe('the PreventEmptyAreaFirefox plugin with firefox browser', function() {
    beforeEach(function() {
      angular.mock.module('esn.summernote-wrapper', function($provide) {
        $provide.value('deviceDetector', {
          browser: 'firefox',
          isMobile: function() { return false; }
        });
      });

      angular.mock.inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
      });
    });

    it('should prevent the editor from being empty', function() {
      var element = compileDirective('<summernote/>');
      element.summernote('focus');
      var editor = angular.element('.note-editable');
      expect(editor.code()).to.equal('<p><br></p>');

      element.summernote('insertText', '');
      expect(editor.code()).to.equal('<p><br></p>');

      element.summernote('insertText', 'Hello world!');
      expect(editor.code()).to.equal('<p>Hello world!<br></p>');
    });
  });

  describe('the PreventEmptyAreaFirefox plugin with a non-firefox browser', function() {
    var PreventEmptyAreaFirefoxPlugin;

    beforeEach(function() {
      PreventEmptyAreaFirefoxPlugin = sinon.spy();

      angular.mock.module('esn.summernote-wrapper', function($provide) {
        $provide.value('deviceDetector', {
          browser: 'chrome',
          isMobile: function() { return false; }
        });
        $provide.value('summernote', {
          addPlugin: function(plugin) {
            plugin();
          }
        });
        $provide.value('PreventEmptyAreaFirefoxPlugin', PreventEmptyAreaFirefoxPlugin);
        $provide.value('FullscreenPlugin', function() {});
      });

      angular.mock.inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
      });
    });

    it('should not be added with a non-firefox browser', function() {
      expect(PreventEmptyAreaFirefoxPlugin).to.not.be.called;
    });
  });
});
