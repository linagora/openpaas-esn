const request = require('supertest');
const { expect } = require('chai');

describe.skip('The Jobqueue module API', function() {
  let helpers, models, app, user;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;

    helpers.modules.initMidway('linagora.esn.jobqueue', helpers.callbacks.noErrorAnd(() => {
      helpers.api.applyDomainDeployment('linagora_test_domain', helpers.callbacks.noErrorAnd(deployedModels => {
        models = deployedModels;

        user = models.users[0];

        app = require('../../backend/webserver/application')(helpers.modules.current.lib.lib, helpers.modules.current.deps);

        done();
      }));
    }));
  });

  afterEach(function(done) {
    helpers.api.cleanDomainDeployment(models, done);
  });

  it('should return 401 if the user is not authenticated', function(done) {
    request(app)
      .get('/')
      .expect(401)
      .end(done);
  });

  it('should return 403 if user is not a platform admin', function(done) {
    request(app)
      .get('/')
      .auth(user.preferredEmail, password)
      .expect(403)
      .end((err, res) => {
        if (err) return done(err);

        expect(res.body).to.deep.equal({
          error: {
            code: 403,
            message: 'Forbidden',
            details: 'To perform this action, you need to be a platformadmin'
          }
        });

        done();
      });
  });

  it('should return 302 if user is a platform admin', function(done) {
    helpers.requireBackend('core/platformadmin')
      .addPlatformAdmin(user)
      .then(() => {
        request(app)
          .get('/')
          .auth(user.preferredEmail, password)
          .expect(302)
          .end(done);
      })
      .catch(err => done(err || 'should resolve'));
  });
});
