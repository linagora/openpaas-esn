const request = require('supertest');
const { expect } = require('chai');

describe('The people API', function() {
  const API_PATH = '/api/people';
  const password = 'secret';
  let app;
  let user2Domain1Member;
  let domain1;
  let helpers;
  let core;

  beforeEach(function(done) {
    helpers = this.helpers;
    const self = this;

    self.mongoose = require('mongoose');

    core = self.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      helpers.requireBackend('core/elasticsearch/pubsub').init();

      helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        expect(err).to.not.exist;
        user2Domain1Member = models.users[1];
        domain1 = models.domain;

        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('GET /api/people', function() {
    describe('When searching for people', function() {
      it('should HTTP 401 when not logged in', function(done) {
        helpers.api.requireLogin(app, 'get', `${API_PATH}/search`, done);
      });

      it('should send back users matching search', function(done) {
        const search = 'lng';

        helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, (err, requestAsMember) => {
          if (err) {
            return done(err);
          }

          requestAsMember(request(app).get(`${API_PATH}/search`)).query({ q: search }).expect(200).end((err, res) => {
            if (err) {
              return done(err);
            }
            expect(res.body).to.not.be.empty;
            done();
          });
        });
      });

      it('should does not send back users when user search is disabled', function(done) {
        const search = 'lng';
        const config = new core['esn-config'].EsnConfig('core', domain1._id);

        config.set({ name: 'membersCanBeSearched', value: false }).then(function() {
          helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, (err, requestAsMember) => {
            if (err) {
              return done(err);
            }

            requestAsMember(request(app).get(`${API_PATH}/search`)).query({ q: search }).expect(200).end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.body).to.be.empty;
              done();
            });
          });
        });
      });
    });
  });
});
