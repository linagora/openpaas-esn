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
  let domain1Users;

  beforeEach(function(done) {
    helpers = this.helpers;
    const self = this;

    self.mongoose = require('mongoose');

    core = self.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      helpers.requireBackend('core/elasticsearch/pubsub').init();

      const userDenormalize = helpers.requireBackend('core/user/denormalize').denormalize;

      helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        expect(err).to.not.exist;
        user2Domain1Member = models.users[1];
        domain1 = models.domain;
        domain1Users = models.users.map(userDenormalize).map(helpers.toComparableObject);

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
        const ids = domain1Users.map(user => user._id);
        const search = 'lng';

        helpers.elasticsearch.checkUsersDocumentsIndexed(ids, err => {
          expect(err).to.not.exist;

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
      });

      it('should does not send back users when user search is disabled', function(done) {
        const search = 'lng';
        const config = new core['esn-config'].EsnConfig('core', domain1._id);
        const ids = domain1Users.map(user => user._id);

        helpers.elasticsearch.checkUsersDocumentsIndexed(ids, err => {
          expect(err).to.not.exist;

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

  describe('POST /api/people', function() {
    it('should send back users matching search with objectTypes including user', function(done) {
      const search = 'lng';
      const ids = domain1Users.map(user => user._id);

      helpers.elasticsearch.checkUsersDocumentsIndexed(ids, function(err) {
        if (err) return done(err);

        helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, (err, requestAsMember) => {
          if (err) return done(err);

          requestAsMember(request(app).post(`${API_PATH}/search`))
            .send({ q: search, objectTypes: ['user']})
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);

              expect(res.body).to.have.lengthOf(3);
              expect(res.body[0]).to.shallowDeepEqual({ id: ids[0], objectType: 'user' });
              expect(res.body[1]).to.shallowDeepEqual({ id: ids[1], objectType: 'user' });
              expect(res.body[2]).to.shallowDeepEqual({ id: ids[2], objectType: 'user' });

              done();
          });
        });
      });
    });

    it('should send back users matching search and not in excluded id list', function(done) {
      const search = 'lng';
      const excludes = [{
        id: user2Domain1Member.id,
        objectType: 'user'
      }];
      const ids = domain1Users.map(user => user._id);

      helpers.elasticsearch.checkUsersDocumentsIndexed(ids, function(err) {
        if (err) return done(err);

        helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, (err, requestAsMember) => {
          if (err) return done(err);

          requestAsMember(request(app).post(`${API_PATH}/search`))
            .send({ q: search, objectTypes: ['user'], excludes })
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);

              expect(res.body).to.not.be.empty;
              expect(res.body.map(result => result.id)).to.not.include(user2Domain1Member.id);
              done();
          });
        });
      });
    });
  });
});
