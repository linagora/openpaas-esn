'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esnSubheaderSaveButtonController controller', function() {
  var $controller, $rootScope, $scope;

  beforeEach(function() {
    module('esn.subheader');
    angular.mock.module('esn.configuration');

    inject(function(_$controller_, _$rootScope_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
    });
  });

  function initController(scope) {
    $scope = scope || $rootScope.$new();

    var controller = $controller('esnSubheaderSaveButtonController', { $scope: $scope });

    $scope.$digest();

    return controller;
  }

  describe('The checkValidThenSubmit fn', function() {

    it('should call onClick when form is valid', function(done) {
      var controller = initController();

      controller.form = {
        $valid: true,
        $pristine: false,
        $setPristine: function() {
          controller.form.$pristine = true;
        },
        $setUntouched: function() {
          controller.form.$setUntouched = true;
        }
      };

      controller.onClick = sinon.stub().returns($q.when());

      controller.checkValidThenSubmit().then(function() {
        expect(controller.onClick).to.have.been.called;
        done();
      });

      $scope.$digest();
    });

    it('should make the form pristine and untouched when onClick fn resolved', function(done) {
      var controller = initController();

      controller.form = {
        $valid: true
      };

      controller.onClick = sinon.stub().returns($q.when());
      controller.form.$setPristine = sinon.spy();
      controller.form.$setUntouched = sinon.spy();

      controller.checkValidThenSubmit().then(function() {
        expect(controller.form.$setPristine).to.have.been.calledOnce;
        expect(controller.form.$setUntouched).to.have.been.calledOnce;
        done();
      });

      $scope.$digest();
    });

    it('should make the form is submitted when form is invalid', function(done) {
      var controller = initController();

      controller.form = {
        $valid: false
      };

      controller.form.$setSubmitted = sinon.spy();

      controller.checkValidThenSubmit().catch(function() {
        expect(controller.form.$setSubmitted).to.have.been.calledOnce;
        done();
      });

      $scope.$digest();
    });

  });

});
