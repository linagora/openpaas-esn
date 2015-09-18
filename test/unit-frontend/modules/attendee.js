'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.attendee Angular module', function() {
  beforeEach(angular.mock.module('esn.attendee'));

  describe('attendeeService service', function() {

    beforeEach(angular.mock.inject(function($rootScope, attendeeService) {
      this.$rootScope = $rootScope;
      this.attendeeService = attendeeService;
    }));

    var query = 'aQuery';
    var limit = 50;

    describe('addProvider() method', function() {
      it('should not add an undefined provider', function(done) {
        this.attendeeService.addProvider();
        this.attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
          expect(attendeeCandidates).to.deep.equal([]);
          done();
        }, function(error) {
          done(error);
        });
        this.$rootScope.$apply();
      });

      it('should not add a provider having no searchAttendee field', function(done) {
        this.attendeeService.addProvider({_id: 'provider'});
        this.attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
          expect(attendeeCandidates).to.deep.equal([]);
          done();
        }, function(error) {
          done(error);
        });
        this.$rootScope.$apply();
      });

      it('should add a provider', function(done) {
        var spy = sinon.spy();
        var newProvider = {_id: 'provider', searchAttendee: spy};
        this.attendeeService.addProvider(newProvider);
        this.attendeeService.getAttendeeCandidates(query, limit).then(function() {
          expect(spy).to.have.been.called;
          done();
        }, function(error) {
          done(error);
        });
        this.$rootScope.$apply();
      });
    });

    describe('getAttendeeCandidates() method', function() {
      it('should call providers and return their aggregated values', function(done) {
        function getTestProvider(attendeeResult) {
          return {
            searchAttendee: function(q, l) {
              expect(q).to.equal(query);
              expect(l).to.equal(limit);
              return $q.when(attendeeResult);
            }
          };
        }

        var attendees1 = [{_id: 'attendee1', displayName: 'yolo'}, {_id: 'attendee2', displayName: 'yala'}];
        var attendees2 = [{_id: 'attendee3', email: 'yolo@yala.com'}];
        this.attendeeService.addProvider(getTestProvider(attendees1));
        this.attendeeService.addProvider(getTestProvider([]));
        this.attendeeService.addProvider(getTestProvider(attendees2));

        this.attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
          expect(attendeeCandidates).to.deep.equal([
            {_id: 'attendee1', displayName: 'yolo'}, {_id: 'attendee2', displayName: 'yala'}, {_id: 'attendee3', email: 'yolo@yala.com'}
          ]);
          done();
        }, function(error) {
          done(error);
        });
        this.$rootScope.$apply();
      });
    });

  });

});
