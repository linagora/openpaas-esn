'use strict';

const expect = require('chai').expect;

describe('The helper middleware', function() {
  let middleware;

  beforeEach(function() {
    middleware = this.helpers.requireBackend('webserver/middleware/helper');
  });

  function createErrorResponse(details, done) {
    return {
      status(code) {
        expect(code).to.equal(400);

        return {
          json(json) {
            expect(json).to.deep.equal({
              error: {
                code: 400,
                message: 'Bad Request',
                details
              }
            });
            done();
          }
        };
      }
    };
  }

  describe('The requireInQuery fn', function() {
    it('should respond 400 when required key is not present in request query', function(done) {
      const req = {
        query: {}
      };
      const res = createErrorResponse('missing q in query', done);

      middleware.requireInQuery('q')(req, res);
    });

    it('should respond 400 when required keys are not present in request query', function(done) {
      const req = {
        query: {}
      };
      const res = createErrorResponse('missing q1, q2 in query', done);

      middleware.requireInQuery(['q1', 'q2'])(req, res);
    });

    it('should support custom error message', function(done) {
      const customMessage = 'my custom message';
      const req = {
        query: {}
      };
      const res = createErrorResponse(customMessage, done);

      middleware.requireInQuery('q', customMessage)(req, res);
    });

    it('should call next when required keys are presented in query', function(done) {
      const req = {
        query: {
          q1: 'it supports falsy values',
          q2: false,
          q3: ''
        }
      };
      const res = {};
      const next = done;

      middleware.requireInQuery(['q1', 'q2', 'q3'])(req, res, next);
    });
  });
});
