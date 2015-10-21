'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.attendee Angular module', function() {
  var $rootScope, attendeeService, DEFAULT_TEMPLATE_URL;

  beforeEach(angular.mock.module('esn.attendee'));

  describe('attendeeService service', function() {

    beforeEach(angular.mock.inject(function(_$rootScope_, _attendeeService_, _DEFAULT_TEMPLATE_URL_) {
      $rootScope = _$rootScope_;
      attendeeService = _attendeeService_;
      DEFAULT_TEMPLATE_URL = _DEFAULT_TEMPLATE_URL_;
    }));

    var query = 'aQuery',
        limit = 50;

    describe('addProvider() method', function() {

      it('should not add an undefined provider', function(done) {
        attendeeService.addProvider();
        attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
          expect(attendeeCandidates).to.deep.equal([]);

          done();
        }, done);

        $rootScope.$apply();
      });

      it('should not add a provider having no searchAttendee field', function(done) {
        attendeeService.addProvider({_id: 'provider'});
        attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
          expect(attendeeCandidates).to.deep.equal([]);

          done();
        }, done);

        $rootScope.$apply();
      });

      it('should add a provider', function(done) {
        var spy = sinon.spy(function() { return $q.reject(); }),
            newProvider = {_id: 'provider', searchAttendee: spy};

        attendeeService.addProvider(newProvider);
        attendeeService.getAttendeeCandidates(query, limit).then(function() {
          expect(spy).to.have.been.called;

          done();
        }, done);

        $rootScope.$apply();
      });

    });

    describe('getAttendeeCandidates() method', function() {

      it('should call providers and return their aggregated values, setting template urls correctly', function(done) {
        function getTestProvider(attendeeResult, templateUrl) {
          return {
            searchAttendee: function(q, l) {
              expect(q).to.equal(query);
              expect(l).to.equal(limit);

              return $q.when(attendeeResult);
            },
            templateUrl: templateUrl
          };
        }

        var attendees1 = [{_id: 'attendee1', displayName: 'yolo'}, {_id: 'attendee2', displayName: 'yala'}],
            attendees2 = [{_id: 'attendee3', email: 'yolo@yala.com'}];

        attendeeService.addProvider(getTestProvider(attendees1));
        attendeeService.addProvider(getTestProvider([]));
        attendeeService.addProvider(getTestProvider(attendees2, '/views/yolo.html'));

        attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
          expect(attendeeCandidates).to.deep.equal([
            {_id: 'attendee1', displayName: 'yolo', templateUrl: DEFAULT_TEMPLATE_URL },
            {_id: 'attendee2', displayName: 'yala', templateUrl: DEFAULT_TEMPLATE_URL },
            {_id: 'attendee3', email: 'yolo@yala.com', templateUrl: '/views/yolo.html' }
          ]);
          done();
        }, done);

        $rootScope.$apply();
      });

    });

  });

});
