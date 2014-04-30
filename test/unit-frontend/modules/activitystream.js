'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {
  describe('activitystreamAPI service', function() {

    beforeEach(function() {
      angular.mock.module('esn.activitystream');
    });
    beforeEach(inject(function(activitystreamAPI, $httpBackend) {
      this.api = activitystreamAPI;
      this.$httpBackend = $httpBackend;
    }));

    describe('get method', function() {
      it('should exist', function() {
        expect(this.api).to.respondTo('get');
      });

      it('should send a request GET /activitystreams/:uuid', function() {
        this.$httpBackend.expectGET('/activitystreams/test').respond([]);
        this.api.get('test');
        this.$httpBackend.flush();
      });

      it('should send a request GET /activitystreams/:uuid, allowing passing some options', function() {
        this.$httpBackend.expectGET('/activitystreams/test?before=someID&limit=30').respond([]);
        this.api.get('test', {before: 'someID', limit: 30});
        this.$httpBackend.flush();
      });
    });
  });

});
