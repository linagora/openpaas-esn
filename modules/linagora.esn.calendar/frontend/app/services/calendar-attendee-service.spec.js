'use strict';

/* global chai: false */

var expect = chai.expect;

describe('the calendarAttendeeService', function() {
  var attendeeService = {};

  beforeEach(function() {
    attendeeService.addProvider = function() {};
    attendeeService.getAttendeeCandidates = function() {
      return $q.when([]);
    };

    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('attendeeService', attendeeService);
    });

    angular.mock.inject(function($rootScope) {
      this.$rootScope = $rootScope;
    });
  });

  beforeEach(angular.mock.inject(function(calendarAttendeeService) {
    this.calendarAttendeeService = calendarAttendeeService;
  }));

  describe('the getAttendeeCandidates function', function() {

    it('should return a promise', function() {
      var promise = this.calendarAttendeeService.getAttendeeCandidates('query', 10);

      expect(promise.then).to.be.a.function;
    });

    it('should add a need-action parstat to all attendeeCandidates returned by the attendeeService', function(done) {
      var query = 'query';
      var limit = 42;

      attendeeService.getAttendeeCandidates = function(q, l) {
        expect(q).to.equal(query);
        expect(l).to.equal(limit);

        return $q.when([{_id: 'attendee1'}, {_id: 'attendee2'}]);
      };

      this.calendarAttendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        expect(attendeeCandidates).to.deep.equal([{_id: 'attendee1', partstat: 'NEEDS-ACTION'}, {_id: 'attendee2', partstat: 'NEEDS-ACTION'}]);
        done();
      }, function(err) {
        done(err);
      });
      this.$rootScope.$apply();
    });
  });
});
