'use strict';

var expect = require('chai').expect;

describe('The request middleware', function() {
  describe('The requireQueryParams function', function() {
    it('should emit a 400 if a parameter is missing', function(done) {
      var middleware = this.helpers.requireBackend('webserver/middleware/request');
      var subject = middleware.requireQueryParams('missing');
      expect(subject).to.be.a.function;

      var req = { query: { existing: true } };
      var res = {
        json: function(code, detail) {
          expect(code).to.equal(400);
          expect(detail.error).to.equal(400);
          expect(detail.message).to.equal('Parameter missing');
          expect(detail.details).to.equal('missing');
          done();
        }
      };
      var next = function() { done(new Error('Unexpectedly passed')); };

      subject(req, res, next);
    });

    it('should pass if the query parameter exists', function(done) {
      var middleware = this.helpers.requireBackend('webserver/middleware/request');
      var subject = middleware.requireQueryParams('existing');
      expect(subject).to.be.a.function;

      var req = { query: { existing: true } };
      var res = { json: function(code, detail) { done(new Error('Unexpectedly returned a ' + code)); } };
      subject(req, res, done);
    });
  });
  describe('The requireBody function', function() {
    it('should pass if there is a body', function(done) {
      var middleware = this.helpers.requireBackend('webserver/middleware/request');
      var req = { body: 'yeah' };
      var res = { json: function(code, detail) { done(new Error('Unexpectedly returned a ' + code)); } };
      middleware.requireBody(req, res, done);
    });
    it('should fail if there is no body', function(done) {
      var middleware = this.helpers.requireBackend('webserver/middleware/request');
      var req = { body: null };
      var res = {
        json: function(code, detail) {
          expect(code).to.equal(400);
          expect(detail.error).to.equal(400);
          expect(detail.message).to.equal('Bad Request');
          expect(detail.details).to.equal('Missing data in body');
          done();
        }
      };
      var next = function() { done(new Error('Unexpectedly passed')); };
      middleware.requireBody(req, res, next);
    });
  });
});
