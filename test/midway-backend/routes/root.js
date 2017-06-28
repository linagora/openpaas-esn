const expect = require('chai').expect;
const request = require('supertest');

describe('The / API', function() {

  let webserver, helpers, core;

  beforeEach(function(done) {
    helpers = this.helpers;

    core = this.testEnv.initCore(() => {
      webserver = helpers.requireBackend('webserver').webserver;
      done();
    });
  });

  describe('The GET / API', function() {
    it('should redirect unauthenticated user to login page', function(done) {
      request(webserver.application)
        .get('/')
        .expect(302)
        .expect('Location', '/login?continue=%2F')
        .end(helpers.callbacks.noError(done));
    });

    it('should run through login handlers', function(done) {
      const testBody = ['test body'];

      // composable-middleware requries next params
      core.auth.handlers.addLoginHandler((req, res, next) => { // eslint-disable-line no-unused-vars
        res.status(200).json(testBody);
      });

      request(webserver.application)
        .get('/')
        .expect(200)
        .end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.deep.equal(testBody);
          done();
        }));
    });
  });
});
