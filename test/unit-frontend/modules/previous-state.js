'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.previous-state module', function() {

  var $previousState, $state, esnPreviousState, $compile, $scope, $rootScope, $window, element;
  var STATE = {
    state: {
      name: 'expected.previousState.name'
    },
    params: {
      expected: 'params'
    }
  };

  beforeEach(module('esn.previous-state'));
  beforeEach(module('jadeTemplates'));

  beforeEach(module(function($provide) {
    $provide.value('$state', $state = {
      go: sinon.spy()
    });
    $provide.value('$previousState', $previousState = {
      get: sinon.stub().returns(STATE)
    });
  }));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$window_, _esnPreviousState_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $window = _$window_;

    esnPreviousState = _esnPreviousState_;
  }));

  describe('the esnPreviousState factory', function() {

    describe('The set() Function', function() {

      it('should set previousState to $previousState service response if it exists', function() {
        esnPreviousState.set();

        expect(esnPreviousState.get()).to.deep.equal(STATE);
      });

      it('should not set the previousState if there is already one', function() {
        esnPreviousState.set();

        $previousState.get = sinon.stub().returns({
          state: {
            name: 'another.state.we.should.not.save'
          },
          params: {
            expected: 'params'
          }
        });

        esnPreviousState.set();

        expect(esnPreviousState.get()).to.deep.equal(STATE);
      });

    });

    describe('The go function', function() {

      it('should unset previousState', function() {
        esnPreviousState.set();
        esnPreviousState.go();

        expect(esnPreviousState.get()).to.equal(null);
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
      esnPreviousState.set();

      element.click();

      expect($state.go).to.have.been.calledWith(STATE.state.name, STATE.params);
    });
  });
});
