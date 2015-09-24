'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.jmap-client-wrapper Angular module', function() {

  beforeEach(function() {
    module('esn.jmap-client-wrapper');
  });

  describe('The dollarHttpTransport factory', function() {

    var $httpBackend, dollarHttpTransport;

    beforeEach(inject(function(_$httpBackend_, _dollarHttpTransport_) {
      $httpBackend = _$httpBackend_;
      dollarHttpTransport = _dollarHttpTransport_;
    }));

    it('should POST on the given URL, passing the given headers and serialize data as JSON', function(done) {
      $httpBackend.expectPOST('/testing', function(data) {
        expect(data).to.deep.equal('[0,1]');

        return true;
      }, function(headers) {
        expect(headers).to.shallowDeepEqual({ a: 'b', c: 1 });

        return true;
      }).respond(200);

      dollarHttpTransport.post('/testing', { a: 'b', c: 1 }, [0, 1]).then(function() { done(); });

      $httpBackend.flush();
    });

    it('should parse the data as JSON and resolve the promise with it', function(done) {
      $httpBackend.expectPOST('/testing').respond(200, '[["test",{"a":"b"}]]');

      dollarHttpTransport.post('/testing').then(function(data) {
        expect(data).to.deep.equal([['test', { a: 'b' }]]);

        done();
      });

      $httpBackend.flush();
    });

    it('should reject the promise if HTTP status code is not 200', function(done) {
      $httpBackend.expectPOST('/testing').respond(400);

      dollarHttpTransport.post('/testing').then(null, function() { done(); });

      $httpBackend.flush();
    });

  });

});
