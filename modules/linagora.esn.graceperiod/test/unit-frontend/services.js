'use strict';

/* global chai: false */

var expect = chai.expect;

describe.skip('The GracePeriod Angular module', function() {

  describe('The gracePeriodService service', function() {

    var gracePeriodService, $httpBackend, $rootScope, $browser, $timeout;

    beforeEach(function() {
      module('linagora.esn.graceperiod');
    });

    beforeEach(angular.mock.inject(function(_gracePeriodService_, _$httpBackend_, _$rootScope_, _$browser_, _$timeout_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      gracePeriodService = _gracePeriodService_;
      $browser = _$browser_;
      $timeout = _$timeout_;
    }));

    describe('The flush fn', function() {

      it('shoulf call PUT /tasks/:id', function(done) {
        var id = '123';

        $httpBackend.expectPUT('/graceperiod/api/tasks/' + id).respond({});

        gracePeriodService.flush(id).then(function() {
          done();
        });

        $rootScope.$apply();
        $httpBackend.flush();
      });

    });

    describe('The cancel fn', function() {

      it('should call DELETE /tasks/:id', function(done) {
        var id = '123';

        $httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond({});

        gracePeriodService.cancel(id).then(function() {
          done();
        });

        $rootScope.$apply();
        $httpBackend.flush();
      });

    });

    describe('The grace fn', function() {
      var oldApplyAsync;

      this.timeout(10000);
      beforeEach(function() {
        oldApplyAsync = $rootScope.$applyAsync;
        $rootScope.$applyAsync = $rootScope.$apply;
      });

      afterEach(function() {
        $rootScope.$applyAsync = oldApplyAsync;
        angular.element('[data-notify="container"]').remove();
      });

      it('should resolve the promise when the delay elapses', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 100).then(function(data) {
          if (!data.cancelled) {
            done();
          }
        });
      });

      it('should resolve the promise when the close button is clicked', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 10000).then(function(data) {
          if (!data.cancelled) {
            done();
          }
        });

        angular.element('[data-notify="dismiss"]').click();
      });

      it('should reject the promise when the cancel link is clicked', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 10000).then(function(data) {
          if (data.cancelled) {
            done();
          }
        });

        angular.element('a.cancel-task').click();
      });

      it('should add a cancel link to the notification', function() {
        gracePeriodService.grace('Test', 'Cancel');

        expect(angular.element('a.cancel-task').length).to.equal(1);
      });

    });
  });

});
