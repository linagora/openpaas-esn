'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The GracePeriod Angular module', function() {

  describe('The gracePeriodService service', function() {

    var gracePeriodService, $httpBackend, $rootScope;

    beforeEach(function() {
      module('linagora.esn.graceperiod');
    });

    beforeEach(angular.mock.inject(function(_gracePeriodService_, _$httpBackend_, _$rootScope_, _$q_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      gracePeriodService = _gracePeriodService_;
    }));

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

      afterEach(function() {
        angular.element('.graceperiod').remove();
      });

      it('should resolve the promise when the delay elapses', function(done) {
        gracePeriodService.grace('Test', 'Cancel', 10).then(function(data) {
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
        angular.element('.ui-pnotify-closer').click();
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
