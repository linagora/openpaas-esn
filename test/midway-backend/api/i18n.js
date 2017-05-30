const expect = require('chai').expect;
const request = require('supertest');

describe('The i18n API', function() {

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

  describe('GET /api/i18n', function() {
    it('should send back 401 if the user is not logged in', function(done) {
      helpers.api.requireLogin(webserver.application, 'get', '/api/platformadmins', done);
    });

    it('should send back 200 with i18n translations', function(done) {
      sendRequestAsUser(dummyUser, loggedInAsUser => {
        loggedInAsUser(request(webserver.application).get('/api/i18n'))
          .expect(200)
          .end(helpers.callbacks.noErrorAnd(res => {
            expect(res.body).to.not.empty;
            expect(res.body).to.have.property('en');
            expect(res.body).to.have.property('fr');
            expect(res.body).to.have.property('vi');
            done();
          }));
      });
    });
  });
});
