const request = require('supertest'),
      { expect } = require('chai');

describe('The Provision API: POST /api/users/provision', function() {
  let app, helpers;
  let domain, user;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;

    this.testEnv.initCore(function() {
      app = helpers.requireBackend('webserver/application');
      helpers.api.applyDomainDeployment('linagora_test_domain', helpers.callbacks.noErrorAnd(models => {
        user = models.users[0];
        domain = models.domain;

        done();
      }));
    });
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  it('should return 401 if not authenticated', function(done) {
    helpers.api.requireLogin(app, 'post', '/api/users/provision', done);
  });

  it('should return 400 if the source query is missing', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const req = loggedInAsUser(request(app).post('/api/users/provision'));

      req.send().expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('missing source in query');
        done();
      });
    }));
  });

  it('should return 400 if the provision source is not supported', function(done) {
    helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const req = loggedInAsUser(request(app).post('/api/users/provision?source=invalid'));

      req.send().expect(400).end((err, res) => {
        expect(err).to.not.exist;
        expect(res.body.error.details).to.equal('invalid is not a valid provision source');
        done();
      });
    }));
  });

  describe('The LDAP provision provider', () => {
    describe('On data verification step', () => {
      it('should return 400 if the emails is not an array', function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          const emails = { foo: 'bar' };
          const req = loggedInAsUser(request(app).post('/api/users/provision?source=ldap'));

          req.send(emails).expect(400).end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body.error.details).to.equal('Input data must be an array');
            done();
          });
        }));
      });

      it('should return 400 if the data contains invalid emails', function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          const emails = ['foo@bar.com', '@#@'];
          const req = loggedInAsUser(request(app).post('/api/users/provision?source=ldap'));

          req.send(emails).expect(400).end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body.error.details).to.equal(`Input data contains invalid emails: ${emails[1]}`);
            done();
          });
        }));
      });
    });

    describe('On provision step', () => {
      let ldap;

      beforeEach(function(done) {
        ldap = helpers.requireFixture('ldap');
        const { EsnConfig } = helpers.requireBackend('core/esn-config');
        const ldapPort = '1389';
        const ldapConfig = {
          name: 'ldap',
          value: [{
            name: 'OP LDAP',
            usage: {
                autoProvisioning: false,
                search: false,
                auth: true
            },
            configuration: {
              url: 'ldap://localhost:1389',
              adminDn: 'uid=admin,ou=passport-ldapauth',
              adminPassword: 'secret',
              searchBase: 'ou=passport-ldapauth',
              searchFilter: '(mail={{username}})'
            }
          }]
        };

        ldap.start(ldapPort, () => {
          new EsnConfig('core', domain._id).set(ldapConfig)
            .then(() => done())
            .catch(done);
        });
      });

      afterEach(function() {
        ldap.close();
      });

      it('should return 201 with emtpy array if no user is found on one of LDAP connections', function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          const emails = ['foo@bar.cc'];
          const req = loggedInAsUser(request(app).post('/api/users/provision?source=ldap'));

          req.send(emails).expect(201).end((err, res) => {
            if (err) return done(err);

            expect(res.body).to.be.empty;
            done();
          });
        }));
      });

      it('should return 201 with provisioned user if user is found on one of LDAP connections', function(done) {
        helpers.api.loginAsUser(app, user.emails[0], password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
          const emails = ['ldapuser@linagora.com'];
          const req = loggedInAsUser(request(app).post('/api/users/provision?source=ldap'));

          req.send(emails).expect(201).end((err, res) => {
            if (err) return done(err);

            const provisionedUsers = res.body;

            expect(provisionedUsers).to.have.lengthOf(1);
            expect(provisionedUsers[0].accounts).to.have.lengthOf(1);
            expect(provisionedUsers[0].accounts[0]).to.shallowDeepEqual({
              type: 'email',
              emails: ['ldapuser@linagora.com']
            });

            done();
          });
        }));
      });
    });
  });
});
