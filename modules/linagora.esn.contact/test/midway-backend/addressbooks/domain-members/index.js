const request = require('supertest');
const { expect } = require('chai');

describe('POST contact/api/addressbook/domainMembers/synchronize', function() {
  let helpers, domain, app, user, normalUser, EsnConfig;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;
    EsnConfig = helpers.requireBackend('core/esn-config').EsnConfig;

    helpers.modules.initMidway('linagora.esn.contact', helpers.callbacks.noErrorAnd(() => {
      helpers.api.applyDomainDeployment('linagora_test_domain', helpers.callbacks.noErrorAnd(models => {
        domain = models.domain;
        user = models.users[0];
        normalUser = models.users[1];

        require('../../../../backend/lib/domain-members')(helpers.modules.current.deps).init();
        app = helpers.modules.getWebServer(require('../../../../backend/webserver/application')(helpers.modules.current.deps));

        helpers.redis.publishConfiguration(helpers.callbacks.noErrorAnd(() => done()));
      }));
    }));
  });

  afterEach(function(done) {
    helpers.mongo.dropDatabase(done);
  });

  function enableFeatureForDomain(domainId) {
    return new EsnConfig('linagora.esn.contact', domainId)
      .set({
        name: 'features',
        value: {
          isDomainMembersAddressbookEnabled: true
        }
      });
  }

  describe('For single domain', function() {
    it('should response 401 if the user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'post', `/api/addressbooks/domainMembers/synchronize?domain_id=${domain._id}`, done);
    });

    it('should response 400 if the and domain id is missing', function(done) {
      helpers.api.loginAsUser(app, user.preferredEmail, password, (err, requestAsMember) => {
        if (err) return done(err);

        requestAsMember(request(app).post('/api/addressbooks/domainMembers/synchronize?domain_id'))
          .send()
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);

            expect(res.body.error).to.deep.equal({
              code: 400,
              message: 'Missing parameter',
              details: 'The domain_id parameter is mandatory'
            });
            done();
          });
      });
    });

    it('should response 400 if domain id is not a objectId', function(done) {
      helpers.api.loginAsUser(app, user.preferredEmail, password, (err, requestAsMember) => {
        if (err) return done(err);

        requestAsMember(request(app).post('/api/addressbooks/domainMembers/synchronize?domain_id=something'))
          .send()
          .expect(400)
          .end((err, res) => {
            if (err) return done(err);

            expect(res.body.error).to.deep.equal({
              code: 400,
              message: 'Bad Request',
              details: 'Invalid domain_id parameter'
            });
            done();
          });
      });
    });

    it('should response 404 if the domain with the given domain id is not found', function(done) {
      helpers.api.loginAsUser(app, user.preferredEmail, password, (err, requestAsMember) => {
        if (err) return done(err);

        requestAsMember(request(app).post('/api/addressbooks/domainMembers/synchronize?domain_id=553486125ed592a10c4e8e6b'))
          .send()
          .expect(404)
          .end((err, res) => {
            if (err) return done(err);

            expect(res.body.error).to.deep.equal({
              code: 404,
              message: 'Not found',
              details: 'The domain 553486125ed592a10c4e8e6b could not be found'
            });
            done();
          });
      });
    });

    it('should response 403 if the scope is domain but the user is not a domain admin', function(done) {
      helpers.api.loginAsUser(app, normalUser.preferredEmail, password, (err, requestAsMember) => {
        if (err) return done(err);

        requestAsMember(request(app).post(`/api/addressbooks/domainMembers/synchronize?domain_id=${domain._id}`))
          .send()
          .expect(403)
          .end((err, res) => {
            if (err) return done(err);

            expect(res.body.error).to.deep.equal({
              code: 403,
              message: 'Forbidden',
              details: 'User is not the domain manager'
            });
            done();
          });
      });
    });

    it('should response 403 if the feature is disabled', function(done) {
      helpers.api.loginAsUser(app, user.preferredEmail, password, (err, requestAsMember) => {
        if (err) return done(err);

        requestAsMember(request(app).post(`/api/addressbooks/domainMembers/synchronize?domain_id=${domain._id}`))
          .send()
          .expect(403)
          .end((err, res) => {
            if (err) return done(err);

            expect(res.body.error).to.deep.equal({
              code: 403,
              message: 'Forbidden',
              details: 'The domain members address book feature is currently disabled.'
            });
            done();
          });
      });
    });

    it('should response 201 if with the number of submited job', function(done) {
      enableFeatureForDomain(domain._id)
        .then(() => {
          helpers.api.loginAsUser(app, user.preferredEmail, password, (err, requestAsMember) => {
            if (err) return done(err);

            requestAsMember(request(app).post(`/api/addressbooks/domainMembers/synchronize?domain_id=${domain._id}`))
              .send()
              .expect(201)
              .end((err, res) => {
                if (err) return done(err);

                expect(res.body.length).to.equal(1);
                expect(res.body[0].domainId).to.equal(domain._id.toString());
                done();
              });
          });
        })
        .catch(done);
    });
  });

  describe('For all domains in platform', function() {
    let domain2;

    beforeEach(function(done) {
      helpers.api.applyDomainDeployment('linagora_test_domain2', (err, models) => {
        if (err) return done(err);

        domain2 = models.domain;
        done();
      });
    });

    it('should response 401 if the user is not authenticated', function(done) {
      helpers.api.requireLogin(app, 'post', '/api/addressbooks/domainMembers/synchronize', done);
    });

    it('should response 403 if the scope is platform but the user is not a platform admin', function(done) {
      helpers.api.loginAsUser(app, user.preferredEmail, password, (err, requestAsMember) => {
        if (err) return done(err);

        requestAsMember(request(app).post('/api/addressbooks/domainMembers/synchronize'))
          .send()
          .expect(403)
          .end((err, res) => {
            if (err) return done(err);

            expect(res.body.error).to.deep.equal({
              code: 403,
              message: 'Forbidden',
              details: 'To perform this action, you need to be a platformadmin'
            });
            done();
          });
      });
    });

    it('should response 201 with the number of submited jobs', function(done) {
      helpers.requireBackend('core/platformadmin')
        .addPlatformAdmin(user)
        .then(() => enableFeatureForDomain(domain2._id)
        .then(() => {
          helpers.api.loginAsUser(app, user.preferredEmail, password, (err, requestAsMember) => {
            if (err) return done(err);

            requestAsMember(request(app).post('/api/addressbooks/domainMembers/synchronize'))
              .send()
              .expect(201)
              .end((err, res) => {
                if (err) return done(err);

                expect(res.body.length).to.equal(1);
                expect(res.body[0].domainId).to.equal(domain2._id.toString());
                done();
              });
          });
        }))
        .catch(done);
    });
  });
});
