'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.previous-page module', function() {

  var $window, $state, esnPreviousPage, $compile, $scope, $rootScope, element;

  beforeEach(module('jadeTemplates'));
  beforeEach(module('esn.previous-page', function($provide) {
    $window = {
     history: {
       back: sinon.spy()
     }
   };

    $provide.value('$state', $state = {
      go: sinon.spy()
    });
    $provide.value('$window', $window);
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _esnPreviousPage_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;

    esnPreviousPage = _esnPreviousPage_;
  }));

  describe('the esnPreviousPage factory', function() {

    describe('The back() Function', function() {

      it('should call $window.history.back if there is previous state and browser history records', function() {
        $window.history.length = 10;
        $rootScope.$emit('$stateChangeStart', null, null, null, null, { location: true });

        esnPreviousPage.back();

        expect($window.history.back).to.have.been.called;
      });

      it('should go to default state if there is no previous state', function() {
        $window.history.length = 10;

        esnPreviousPage.back('expected.state');

        expect($window.history.back).to.not.have.been.called;
        expect($state.go).to.have.been.calledWith('expected.state');
      });

      it('should go to default state if there is previous state but no record in browser history', function() {
        $window.history.length = null;

        esnPreviousPage.back('expected.state');
        $rootScope.$emit('$stateChangeStart', null, null, null, null, { location: true });

        expect($window.history.back).to.not.have.been.called;
        expect($state.go).to.have.been.calledWith('expected.state');
      });

    });
  });

  describe('The esnBackButton directive', function() {
    function compileDirective(html, data) {
      element = angular.element(html);
      element.appendTo(document.body);

      if (data) {
        angular.forEach(data, function(value, key) {
          element.data(key, value);
        });
      }

      $compile(element)($scope);
      $scope.$digest();

      return element;
    }

    beforeEach(function() {
      $scope = $rootScope.$new();

      compileDirective('<button esn-back-button="expected.default.state" />');
    });

    afterEach(function() {
      if (element) {
        element.remove();
      }
    });

    it('should call esnPreviousPage.back', function() {
      esnPreviousPage.back = sinon.spy();

      element.click();

      expect(esnPreviousPage.back).to.have.been.calledOnce;
    });
  });

});
