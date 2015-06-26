'use strict';

describe.only('The GracePeriod Angular module', function() {

  describe('The gracePeriodService service', function() {

    beforeEach(function() {
      angular.mock.module('linagora.esn.graceperiod');
    });

    beforeEach(angular.mock.inject(function(gracePeriodService, $httpBackend, $rootScope, $q) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.gracePeriodService = gracePeriodService;
      this.$q = $q;
    }));

    describe('The cancel fn', function() {
      it('should call DELETE /tasks/:id', function(done) {

        var id = '123';
        this.$httpBackend.expectDELETE('/graceperiod/api/tasks/' + id).respond({});

        this.gracePeriodService.cancel(id).then(function() {
          done();
        });
        this.$rootScope.$apply();
        this.$httpBackend.flush();
      });
    });
  });
});
