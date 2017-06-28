const expect = require('chai').expect;
const request = require('supertest');

describe('The /logout API', function() {

  let webserver, helpers, core;

  beforeEach(function(done) {
    helpers = this.helpers;

    core = this.testEnv.initCore(() => {
      webserver = helpers.requireBackend('webserver').webserver;
      done();
    });
  });

  describe('The GET /logout API', function() {
    it('should log the user out and redirect to /', function(done) {
      request(webserver.application)
        .get('/logout')
        .expect(302)
        .expect('Location', '/')
        .end(helpers.callbacks.noError(done));
    });

    it('should run through logout handlers', function(done) {
      const testBody = ['test body'];

      // composable-middleware requries next params
      core.auth.handlers.addLogoutHandler((req, res, next) => { // eslint-disable-line no-unused-vars
        res.status(200).json(testBody);
      });

      request(webserver.application)
        .get('/logout')
        .expect(200)
        .end(helpers.callbacks.noErrorAnd(res => {
          expect(res.body).to.deep.equal(testBody);
          done();
        }));
    });
  });
});
