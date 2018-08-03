'use strict';

const request = require('supertest'),
    expect = require('chai').expect;

describe('PUT api/users/:uuid/states route', function() {
  let app;
  let user1Domain1Manager, user2Domain1Member;
  let user1Domain2Manager;
  let domain1;
  const password = 'secret';
  let helpers;

  beforeEach(function(done) {
    helpers = this.helpers;
    const self = this;

    self.mongoose = require('mongoose');

    self.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        expect(err).to.not.exist;
        user1Domain1Manager = models.users[0];
        user2Domain1Member = models.users[1];
        domain1 = models.domain;

        helpers.api.applyDomainDeployment('linagora_test_domain2', function(err, models2) {
          expect(err).to.not.exist;
          user1Domain2Manager = models2.users[0];

          helpers.elasticsearch.saveTestConfiguration(helpers.callbacks.noError(done));
        });
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  it('should return 401 if not authenticated', function(done) {
    helpers.api.requireLogin(app, 'put', `/api/users/${user2Domain1Member._id}/states?domain_id=${domain1._id}`, done);
  });

  it('should return 400 if the states is missing', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/states?domain_id=${domain1._id}`));

      req.send().expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('body should be an array');
        done();
      });
    });
  });

  it('should return 400 if the states is not an array', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      const states = { name: 'login', value: 'disabled' };
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/states?domain_id=${domain1._id}`));

      req.send(states).expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('body should be an array');
        done();
      });
    });
  });

  it('should return 400 if the state name is not valid', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      const states = [{ name: 'login', value: 'notvalid' }];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/states?domain_id=${domain1._id}`));

      req.send(states).expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('States is not valid');
        done();
      });
    });
  });

  it('should return 400 if the state value is not valid', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      const states = [{ name: 'notvalid', value: 'enabled' }];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/states?domain_id=${domain1._id}`));

      req.send(states).expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('States is not valid');
        done();
      });
    });
  });

  it('should return 400 if the domain_id query is missing', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      const states = [{ name: 'login', value: 'enabled' }];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/states`));

      req.send(states).expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('The domain_id parameter is mandatory');
        done();
      });
    });
  });

  it('should return 403 if the request user is not domain manager', function(done) {
    helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      const states = [{ name: 'login', value: 'enabled' }];
      const req = loggedInAsUser(request(app).put(`/api/users/${user1Domain1Manager._id}/states?domain_id=${domain1._id}`));

      req.send(states).expect(403).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('User is not the domain manager');
        done();
      });
    });
  });

  it('should return 403 if domain manager trying to modify states of user that is not the domain member', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      const states = [{name: 'login', value: 'enabled'}];
      const req = loggedInAsUser(request(app).put(`/api/users/${user1Domain2Manager._id}/states?domain_id=${domain1._id}`));

      req.send(states).expect(403).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.details).to.equal('User does not belongs to the domain');
        done();
      });
    });
  });

  it('should return 204 if update user states successfully', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, function(err, loggedInAsUser) {
      if (err) {
        return done(err);
      }
      const states = [{name: 'login', value: 'enabled'}];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/states?domain_id=${domain1._id}`));

      req.send(states).expect(204).end(err => {
        expect(err).to.not.exist;
        done();
      });
    });
  });
});
