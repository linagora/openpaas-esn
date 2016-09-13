'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.previous-state module', function() {

  var $previousState, $state, esnPreviousState, $compile, $scope, $rootScope, $window, element;

  beforeEach(module('esn.previous-state'));
  beforeEach(module('jadeTemplates'));

  beforeEach(inject(function(_$previousState_, _$state_, _$compile_, _$rootScope_, _$window_, _esnPreviousState_) {
    $previousState = _$previousState_;
    $state = _$state_;
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $window = _$window_;
    esnPreviousState = _esnPreviousState_;
  }));

  describe('the esnPreviousState factory', function() {
    describe('The set() Function', function() {

      it('should set previousState to $previousState service response if it exists', function() {
        $previousState.get = sinon.stub().returns({
          state: {
            name: 'expected.previousState.name'
          },
          params: {
            expected: 'params'
          }
        });

        esnPreviousState.set();

        expect(esnPreviousState.get()).to.deep.equal({
          state: {
            name: 'expected.previousState.name'
          },
          params: {
            expected: 'params'
          }
        });
      });

    });
  });

  describe('The esnBackButton directive', function() {
    function compileDirective(html, data) {
      element = angular.element(html);
      element.appendTo(document.body);

      if (data) {
        for (var key in data) {
          if (data.hasOwnProperty(key)) {
            element.data(key, data[key]);
          }
        }
      }

      $compile(element)($scope);
      $scope.$digest();

      return element;
    }

    beforeEach(function() {
      $scope = $rootScope.$new();
      $state.go = sinon.spy();

      compileDirective('<button esn-back-button="expected.default.state" />');
    });

    afterEach(function() {
      if (element) {
        element.remove();
      }
    });

    it('should call history.back if no $previousState', function() {
      $window.history.back = sinon.spy();
      $previousState.get = sinon.stub().returns(null);

      element.click();

      expect(history.back).to.have.been.calledOnce;
    });

    it('should go to default state if no $previousState nor history', function() {
      $window.history = null;
      $previousState.get = sinon.stub().returns(null);

      element.click();

      expect($state.go).to.have.been.calledWith('expected.default.state');
    });

    it('should go to last eligible state if $previousState exists', function() {
      $previousState.get = sinon.stub().returns({
        state: {
          name: 'last.eligible.state'
        },
        params: {
          expected: 'params'
        }
      });
      esnPreviousState.set();

      element.click();

      expect($state.go).to.have.been.calledWith('last.eligible.state', { expected: 'params' });
    });

    it('should destroy previousState when clicking the element', function() {
      esnPreviousState.unset = sinon.spy();

      element.click();

      expect(esnPreviousState.unset).to.have.been.calledOnce;
    });
  });
});
