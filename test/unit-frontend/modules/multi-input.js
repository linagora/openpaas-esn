'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The multi-input Angular module', function() {

  beforeEach(function() {
    angular.mock.module('esn.multi-input');
    module('jadeTemplates');
  });

  describe('The MultiInputGroupController controller', function() {

    var $scope, $rootScope, $controller, ctrl;
    var multiInputService, timeout;

    beforeEach(angular.mock.inject(function(_$rootScope_, _$controller_, _multiInputService_, _$timeout_) {
      $rootScope = _$rootScope_;
      $controller = _$controller_;
      multiInputService = _multiInputService_;
      timeout = _$timeout_;
      $scope = $rootScope.$new();
      ctrl = $controller('MultiInputGroupController', {
        $scope: $scope,
        $timeout: timeout,
        multiInputService: multiInputService
      });
      $scope.$digest();
      $scope.types = [''];
    }));

    it('should init content value if it is undefined', function() {
      expect($scope.content).to.deep.equal([{}]);
    });

    it('should init showDeleteButton array', function() {
      expect($scope.showDeleteButtonArray).to.deep.equal([]);
    });

    describe('The onFocusFn fn', function() {

      it('should insert true value in showDeleteButton if it is undefined', function() {
        $scope.onFocusFn(1);
        expect($scope.showDeleteButtonArray[1]).is.true;
      });

      it('should insert true value in showAddButton', function() {
        $scope.onFocusFn(1);
        expect($scope.showAddButton).is.true;
      });

      it('should insert true value in showDeleteButton', function() {
        $scope.showDeleteButtonArray[2] = false;
        $scope.onFocusFn(2);
        expect($scope.showDeleteButtonArray[2]).is.true;
      });

    });

    describe('The hideDeleteButton fn', function() {

      it('should insert false value in showDeleteButton if it is true', function() {
        $scope.showDeleteButtonArray[2] = true;
        $scope.hideDeleteButton(2);
        timeout.flush();
        expect($scope.showDeleteButtonArray[2]).is.false;
      });

    });

    describe('The verifyNew fn', function() {

      it('should affect true value to showAddButton', function() {
        $scope.showAddButton = false;
        $scope.verifyNew();
        expect($scope.showAddButton).is.true;
      });

      it('should call onFocusFn fn with correct params', function() {
        $scope.onFocusFn = sinon.spy();
        $scope.verifyNew(123);
        expect($scope.onFocusFn).have.been.calledWith(123);

      });
    });

    describe('The addField fn', function() {

      it('should affect false value to showAddButton', function() {
        $scope.showAddButton = true;
        ctrl.addField();
        expect($scope.showAddButton).is.false;
      });

      it('should add one field scope content', function() {
        $scope.content = [];
        ctrl.addField();
        expect($scope.content).to.deep.equal([{
          value: '',
          type: ''
        }]);
      });

      it('should call focusLastItem with correct value', function() {
        $scope.content = [];
        multiInputService.focusLastItem = sinon.spy();
        ctrl.addField('element');
        expect(multiInputService.focusLastItem).have.been.calledWith('element', '.multi-input-content .multi-input-text');
      });
    });

    describe('The deleteField fn', function() {

      it('should affect false value to showAddButton if content is empty after remove item', function() {
        $scope.content = [];
        $scope.showAddButton = true;
        ctrl.deleteField();
        expect($scope.showAddButton).is.false;
      });

      it('should remove one item scope content', function() {
        $scope.content = ['1', '2', '3'];
        ctrl.deleteField(null, 1);
        expect($scope.content).to.deep.equal(['1', '3']);
      });

      it('should call focusLastItem with correct value', function() {
        $scope.content = [];
        multiInputService.focusLastItem = sinon.spy();
        ctrl.deleteField('element', 1);
        expect(multiInputService.focusLastItem).have.been.calledWith('element', '.multi-input-content .multi-input-text');
      });
    });

    describe('The isMultiTypeField fn', function() {

      it('should return correct value', function() {
        expect($scope.isMultiTypeField()).is.true;
        $scope.types = null;
        expect($scope.isMultiTypeField()).is.false;
      });
    });
  });

  describe('The multiInputService factory', function() {

    var $rootScope;
    var multiInputService, timeout;

    beforeEach(angular.mock.inject(function(_$rootScope_, _multiInputService_, _$timeout_) {
      $rootScope = _$rootScope_;
      multiInputService = _multiInputService_;
      timeout = _$timeout_;
    }));

    describe('The focusLastItem fn', function() {

      it('should focus on the last field', function(done) {
        var className = 'class';
        var element = {
          find: function(element) {
            expect(element).to.equal(className);
            return {
              last: function() {
                return {
                  focus: done
                };
              }
            };
          }
        };
        multiInputService.focusLastItem(element, className);
        timeout.flush();
      });
    });
  });
});
