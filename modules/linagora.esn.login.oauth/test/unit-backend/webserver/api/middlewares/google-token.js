'use strict';

const mockery = require('mockery');
const expect = require('chai').expect;
const sinon = require('sinon');
const q = require('q');

describe('The google middlewares', function() {
  let dependencies;
  let requireBackend;

  beforeEach(function() {
    requireBackend = this.helpers.requireBackend;
    dependencies = this.moduleHelpers.dependencies;
    this.testEnv.basePath = './../modules/linagora.esn.login.oauth';
  });

  describe('The getAccessToken function', function() {
    function getModule() {
      return requireBackend('webserver/api/middlewares/google-token')(dependencies);
    }

    it('should not call getAccessTokenFn if access_token is defined', function(done) {
      const req = {
        body: {
          access_token: 'access_token'
        }
      };
      const getAccessTokenFn = sinon.spy();

      mockery.registerMock('./../../../lib/helpers/google', function() {
        return {
          getAccessToken: getAccessTokenFn
        };
      });
      const res = {};
      const next = function() {
          expect(getAccessTokenFn).to.not.have.been.called;
          done();
        };

      getModule().getAccessToken(req, res, next);
    });

    it('should send back HTTP 500 on getAccessToken() error', function(done) {
      const getAccessTokenFn = sinon.stub().returns(q.reject(new Error('Can not get access token')));
      const next = function() {};
      const req = {
        body: {}
      };
      const res = this.helpers.express.jsonResponse(
        function(code) {
          expect(code).to.equal(500);
          expect(getAccessTokenFn).to.have.been.called;

          done();
        }
      );

      mockery.registerMock('./../../../lib/helpers/google', function() {
        return {
          getAccessToken: getAccessTokenFn
        };
      });

      getModule().getAccessToken(req, res, next);
    });
  });
});
