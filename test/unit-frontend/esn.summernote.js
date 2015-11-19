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

  describe('the SupportPlaceholder plugin', function() {
    beforeEach(function() {
      angular.mock.module('esn.summernote-wrapper');
      angular.mock.inject(function(_$compile_, _$rootScope_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
      });
    });

    it('should leverage the content of the summernote editor to toggle empty class on the contenteditable element', function() {
      var element = compileDirective('<summernote/>');
      element.summernote('focus');
      var contentEditable = angular.element('[contenteditable="true"]');
      expect(contentEditable.hasClass('empty')).to.be.true;

      element.summernote('insertText', 'Hello world!');
      expect(contentEditable.hasClass('empty')).to.be.false;

      element.summernote('undo');
      expect(contentEditable.hasClass('empty')).to.be.true;
    });
  });

  describe('the MoveCursorContentEditable factory', function() {
    var MoveCursorContentEditable, MobileFirefoxNewlinePlugin, event;

    beforeEach(function() {
      event = {
        preventDefault: sinon.spy()
      };
      angular.mock.module('esn.summernote-wrapper');
      angular.mock.inject(function(_$compile_, _$rootScope_, _MoveCursorContentEditable_, _MobileFirefoxNewlinePlugin_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        MoveCursorContentEditable = _MoveCursorContentEditable_;
        MobileFirefoxNewlinePlugin = _MobileFirefoxNewlinePlugin_;
      });
    });

    describe('the moveCursorFocusedSelection method', function() {
      it('should move the cursor to the corresponding location', function() {
        var contentEditable = compileDirective('<div contenteditable="true">First Second Third</div>');
        contentEditable.focus();

        MoveCursorContentEditable.moveCursorFocusedSelection(contentEditable[0].childNodes[0], 12);
        MobileFirefoxNewlinePlugin.events.insertParagraph(event);
        expect(contentEditable.code()).to.equal('First Second<br> Third');

        MoveCursorContentEditable.moveCursorFocusedSelection(contentEditable[0].childNodes[0], 5);
        MobileFirefoxNewlinePlugin.events.insertParagraph(event);
        expect(contentEditable.code()).to.equal('First<br> Second<br> Third');
      });
    });
  });

  describe('the MobileFirefoxNewline plugin', function() {
    var $window, MobileFirefoxNewlinePlugin, preventDefaultSpy, event, MoveCursorContentEditable;

    beforeEach(function() {
      preventDefaultSpy = sinon.spy();
      event = {
        preventDefault: preventDefaultSpy
      };

      angular.mock.module('esn.summernote-wrapper');
      angular.mock.inject(function(_$compile_, _$window_, _$rootScope_, _MobileFirefoxNewlinePlugin_, _MoveCursorContentEditable_) {
        $compile = _$compile_;
        $window = _$window_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        MobileFirefoxNewlinePlugin = _MobileFirefoxNewlinePlugin_;
        MoveCursorContentEditable = _MoveCursorContentEditable_;
      });
    });

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
      MoveCursorContentEditable.moveCursorFocusedSelection(contentEditable[0].childNodes[0], 14);

      MobileFirefoxNewlinePlugin.events.insertParagraph(event);
      expect(preventDefaultSpy).to.be.called;
      expect(contentEditable.code()).to.equal('The first line<br> The second line');
    });

    it('should insert a <br> tag at end of a paragraph', function() {
      var contentEditable = compileDirective('<div contenteditable="true"><pr>The first line</pr><p>The second line</p></div>');
      contentEditable.focus();
      // move the cursor to the end of the second paragraph
      MoveCursorContentEditable.moveCursorFocusedSelection(contentEditable[0].childNodes[1], 1);

      MobileFirefoxNewlinePlugin.events.insertParagraph(event);
      expect(preventDefaultSpy).to.be.called;
      expect(contentEditable.code()).to.equal('<pr>The first line</pr><p>The second line<br></p>');
    });

    it('should insert a <br> tag inside a paragraph', function() {
      var contentEditable = compileDirective('<div contenteditable="true"><pr>The first line</pr><p>The second lineThe third line</p></div>');
      contentEditable.focus();
      // set the cursor between "The second line" and "The third line"
      MoveCursorContentEditable.moveCursorFocusedSelection(contentEditable[0].childNodes[1].childNodes[0], 15);

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

  describe('the PreventEmptyArea plugin', function() {
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
});
