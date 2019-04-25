const request = require('supertest');
const { expect } = require('chai');

describe('PUT api/users/:uuid/emails route', function() {
  let app, helpers;
  let domain1, user1Domain1Manager, user2Domain1Member, user1Domain2Manager;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;

    this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      helpers.api.applyDomainDeployment('linagora_test_domain', helpers.callbacks.noErrorAnd(models => {
        user1Domain1Manager = models.users[0];
        user2Domain1Member = models.users[1];
        domain1 = models.domain;

        helpers.api.applyDomainDeployment('linagora_test_domain2', helpers.callbacks.noErrorAnd(models2 => {
          user1Domain2Manager = models2.users[0];
          helpers.elasticsearch.saveTestConfiguration(helpers.callbacks.noError(done));
        }));
      }));
    });
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  it('should return 401 if not authenticated', function(done) {
    helpers.api.requireLogin(app, 'put', `/api/users/${user2Domain1Member._id}/emails?domain_id=${domain1._id}`, done);
  });

  it('should return 400 if the emails is missing', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/emails?domain_id=${domain1._id}`));

      req.send().expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('body should be an array');
        done();
      });
    }));
  });

  it('should return 400 if the emails is not an array', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const emails = { foo: 'bar' };
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/emails?domain_id=${domain1._id}`));

      req.send(emails).expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('body should be an array');
        done();
      });
    }));
  });

  it('should return 400 if the preferred email of the target user is removed', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const emails = ['foo@bar.com'];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/emails?domain_id=${domain1._id}`));

      req.send(emails).expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('User preferred email must not be removed');
        done();
      });
    }));
  });

  it('should return 400 if there are new emails but they are not available', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const emails = [user2Domain1Member.emails[0], user1Domain1Manager.emails[0], user1Domain2Manager.emails[0]];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/emails?domain_id=${domain1._id}`));

      req.send(emails).expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal(`Emails already in use: ${user1Domain1Manager.emails[0]}, ${user1Domain2Manager.emails[0]}`);
        done();
      });
    }));
  });

  it('should return 400 if the domain_id is invalid', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const emails = [user2Domain1Member.emails[0]];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/emails?domain_id=123`));

      req.send(emails).expect(400).end((err, res) => {
        expect(err).to.not.exist;

        expect(res.body.error.details).to.equal('Invalid domain_id parameter');
        done();
      });
    }));
  });

  it('should return 403 if the request user is not domain manager', function(done) {
    helpers.api.loginAsUser(app, user2Domain1Member.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const emails = [user1Domain1Manager.emails[0]];
      const req = loggedInAsUser(request(app).put(`/api/users/${user1Domain1Manager._id}/emails?domain_id=${domain1._id}`));

      req.send(emails).expect(403).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('User is not the domain manager');
        done();
      });
    }));
  });

  it('should return 403 if domain manager trying to modify emails of user that is not the domain member', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const emails = [user1Domain2Manager.emails[0]];
      const req = loggedInAsUser(request(app).put(`/api/users/${user1Domain2Manager._id}/emails?domain_id=${domain1._id}`));

      req.send(emails).expect(403).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.details).to.equal('User does not belongs to the domain');
        done();
      });
    }));
  });

  it('should return 404 if the domain is not found', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const ObjectId = require('bson').ObjectId;
      const notFoundDomainId = new ObjectId();
      const emails = [user2Domain1Member.emails[0]];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/emails?domain_id=${notFoundDomainId}`));

      req.send(emails).expect(404).end((err, res) => {
        expect(err).to.not.exist;

        expect(res.body.error.details).to.equal(`The domain ${notFoundDomainId} could not be found`);
        done();
      });
    }));
  });

  it('should return 204 if update user emails successfully', function(done) {
    helpers.api.loginAsUser(app, user1Domain1Manager.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const userModel = helpers.requireBackend('core/db/mongo/models/user');
      const emails = ['foo@bar.com', user2Domain1Member.emails[0]];
      const req = loggedInAsUser(request(app).put(`/api/users/${user2Domain1Member._id}/emails?domain_id=${domain1._id}`));

      req.send(emails).expect(204).end(err => {
        expect(err).to.not.exist;
        userModel.findById(user2Domain1Member._id, (err, user) => {
          if (err) done(err);

          const emailAccount = user.accounts.find(account => account.type === 'email');

          expect(emailAccount.emails.length).to.equal(2);
          expect(emailAccount.emails[0]).to.equal('foo@bar.com');
          expect(emailAccount.emails[1]).to.equal(user2Domain1Member.emails[0]);
          expect(emailAccount.preferredEmailIndex).to.equal(1);
          done();
        });
      });
    }));
  });
});
