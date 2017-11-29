const expect = require('chai').expect;
const request = require('supertest');

describe('The availability API', function() {
  let webserver, fixtures, helpers, dummyUser;

  beforeEach(function(done) {
    helpers = this.helpers;

    this.mongoose = require('mongoose');

    this.testEnv.initCore(() => {
      webserver = helpers.requireBackend('webserver').webserver;
      fixtures = helpers.requireFixture('models/users.js')(helpers.requireBackend('core/db/mongo/models/user'));

      fixtures.newDummyUser(['dummy-user@email.com'])
        .save(helpers.callbacks.noErrorAnd(user => {
          dummyUser = user;
          done();
        }));
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db
      .dropDatabase(helpers.callbacks.noErrorAnd(() => this.mongoose.disconnect(done)));
  });

  function sendRequestAsUser(user, next) {
    helpers.api.loginAsUser(
      webserver.application, user.emails[0], fixtures.password,
      helpers.callbacks.noErrorAnd(loggedInAsUser => next(loggedInAsUser))
    );
  }

  describe('GET /api/availability', function() {
    it('should send back 401 when not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/availability', done);
    });

    it('should respond 400 when resourceType query is missing', function(done) {
      sendRequestAsUser(dummyUser, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
          .get('/api/availability')
          .query('resourceId=e@mail')
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body.error.details).to.equal('missing resourceType in query');
            done();
          }));
      });
    });

    it('should respond 400 when resourceId query is missing', function(done) {
      sendRequestAsUser(dummyUser, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
          .get('/api/availability')
          .query('resourceType=email')
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body.error.details).to.equal('missing resourceId in query');
            done();
          }));
      });
    });

    it('should respond 400 when resourceType query is not supported', function(done) {
      sendRequestAsUser(dummyUser, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
          .get('/api/availability')
          .query('resourceType=whatever')
          .query('resourceId=123')
        )
          .expect(400)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body.error.details).to.equal('Unsupported resourceType: whatever');
            done();
          }));
      });
    });

    it('should respond 200 with availability result (unavailable)', function(done) {
      sendRequestAsUser(dummyUser, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
          .get('/api/availability')
          .query('resourceType=email')
          .query(`resourceId=${dummyUser.emails[0]}`)
        )
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              available: false
            });
            done();
          }));
      });
    });

    it('should respond 200 with availability result (available)', function(done) {
      sendRequestAsUser(dummyUser, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
          .get('/api/availability')
          .query('resourceType=email')
          .query('resourceId=random@email}')
        )
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              available: true
            });
            done();
          }));
      });
    });

    it('should respond 200 with availability result (unavailable due to validation failed)', function(done) {
      sendRequestAsUser(dummyUser, loggedInAsUser => {
        loggedInAsUser(
          request(webserver.application)
          .get('/api/availability')
          .query('resourceType=email')
          .query('resourceId=not_an_email}')
        )
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.shallowDeepEqual({
              available: false
            });
            done();
          }));
      });
    });
  });
});
