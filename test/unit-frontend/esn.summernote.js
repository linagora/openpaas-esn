'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.summernote Angular module', function() {

  var $compile, $rootScope, $scope, element;

  beforeEach(function() {
    angular.mock.module('esn.summernote-wrapper');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
  }));

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

    it('should broadcast a hide/show in alternance while toggling the icon every time the fullscreen button of summernote toolbar is clicked', function() {
      var hide = sinon.spy(), show = sinon.spy();
      $scope.$on('header:hide', function() {
        hide();
      });
      $scope.$on('header:show', function() {
        show();
      });
      var element = compileDirective('<div><summernote/></div>');
      var btn = element.find('[data-name="fullscreen"]');
      var icon = element.find('[data-name="fullscreen"] > i');
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
});
