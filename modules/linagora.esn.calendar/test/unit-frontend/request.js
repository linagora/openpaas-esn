'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The request factory', function() {
  beforeEach(function() {
    angular.mock.module('esn.calendar');
    angular.mock.inject(function(request, $httpBackend) {
      this.$httpBackend = $httpBackend;
      this.requestFactory = request;
    });
  });

  it('should perform a call to the given path on the DAV proxy', function(done) {
    var event = {id: 'eventId'};
    this.$httpBackend.expectGET('/dav/api/calendars/test/events.json').respond(event);
    this.requestFactory('get', '/calendars/test/events.json').then(function(response) {
      expect(response.data).to.deep.equal(event);
      done();
    }, done);
    this.$httpBackend.flush();
  });

  it('should perform a call to the DAV proxy even if the given path contains another base URL', function(done) {
    var event = {id: 'eventId'};
    this.$httpBackend.expectGET('/dav/api/calendars/test/events.json').respond(event);
    this.requestFactory('get', 'caldav/server/base/URL/calendars/test/events.json').then(function(response) {
      expect(response.data).to.deep.equal(event);
      done();
    }, done);
    this.$httpBackend.flush();
  });
});
