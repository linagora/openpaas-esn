'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The calDavRequest factory', function() {

  beforeEach(function() {
    module('esn.calendar');
  });

  beforeEach(function() {
    inject(function(calDavRequest, $httpBackend) {
      this.$httpBackend = $httpBackend;
      this.requestFactory = calDavRequest;
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
