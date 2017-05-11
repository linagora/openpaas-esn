'use strict';

/* global chai */

var expect = chai.expect;

describe('The calendarHomeService service', function() {
  var $rootScope, calendarHomeService, session, businessHours, ESN_CONFIG_DEFAULT;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(_calendarHomeService_, _session_, _ESN_CONFIG_DEFAULT_, _$rootScope_) {
    session = _session_;
    calendarHomeService = _calendarHomeService_;
    ESN_CONFIG_DEFAULT = _ESN_CONFIG_DEFAULT_;
    $rootScope = _$rootScope_;

    businessHours = [{
      daysOfWeek: [1, 2, 3, 4],
      start: '00:00',
      end: '24:00'
    }];

    session.setDomain({
      _id: 'domain'
    });
  }));

  describe('The getUserBusinessHours function', function() {

    function getExpectedResult(businessHours) {
      return businessHours.map(function(businessHour) {
        businessHour.dow = businessHour.daysOfWeek;
        delete businessHour.daysOfWeek;

        return businessHour;
      });
    }

    it('should get user working hours configuration', function(done) {
      session.setUser({
        _id: 'user',
        emails: [],
        configurations: {
          domain_id: 'domain',
          modules: [{
            name: 'core',
            configurations: [{
              name: 'businessHours',
              value: businessHours
            }]
          }]
        }
      });

      calendarHomeService.getUserBusinessHours()
        .then(function(result) {
          expect(result).to.deep.equal(getExpectedResult(businessHours));
          done();
        });
      $rootScope.$digest();
    });

    it('should get default business hours if there is no configuration', function(done) {
      session.setUser({
        _id: 'user',
        emails: [],
        configurations: {
          domain_id: 'domain123',
          modules: [{
            name: 'core',
            configurations: []
          }]
        }
      });

      calendarHomeService.getUserBusinessHours()
        .then(function(result) {
          expect(result).to.deep.equal(getExpectedResult(ESN_CONFIG_DEFAULT.core.businessHours));
          done();
        });
      $rootScope.$digest();
    });
  });
});
