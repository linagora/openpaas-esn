'use strict';

const request = require('supertest');

describe('The Identities API', function() {

  const IDENTITY = {
    id: 'default',
    isDefault: true,
    name: 'Name',
    email: '<%= user.preferredEmail %>',
    textSignature: 'My signature'
  };
  const INVALID_IDENTITY = {
    email: '<%= user.preferredEmail'
  };

  let helpers, models, app;

  beforeEach(function(done) {
    helpers = this.helpers;

    helpers.modules.initMidway('linagora.esn.unifiedinbox', helpers.callbacks.noErrorAnd(() => {
      helpers.api.applyDomainDeployment('linagora_test_domain', helpers.callbacks.noErrorAnd(deployedModels => {
        models = deployedModels;

        done();
      }));
    }));
  });

  beforeEach(function() {
    app = require('../../backend/webserver/application')(helpers.modules.current.deps);
  });

  afterEach(function(done) {
    helpers.requireBackend('core/esn-config')('identities.default').inModule('linagora.esn.unifiedinbox').store(null).then(() => helpers.api.cleanDomainDeployment(models, done));
  });

  describe('GET /api/inbox/identities/default', function() {

    it('should return 401 if the user is not authenticated', function(done) {
      request(app)
        .get('/api/inbox/identities/default')
        .expect(401)
        .end(done);
    });

    it('should return the default identity if there is nothing in database', function(done) {
      request(app)
        .get('/api/inbox/identities/default')
        .auth('user1@lng.net', 'secret')
        .expect(200, '{"id":"default","isDefault":true,"description":"My default identity","name":"a user1","email":"user1@lng.net","replyTo":"user1@lng.net","textSignature":""}')
        .end(done);
    });

    it('should return the default identity, with a localized description, if there is nothing in database', function(done) {
      request(app)
        .get('/api/inbox/identities/default')
        .set('Accept-Language', 'fr')
        .auth('user1@lng.net', 'secret')
        .expect(200, '{"id":"default","isDefault":true,"description":"Mon identité par défaut","name":"a user1","email":"user1@lng.net","replyTo":"user1@lng.net","textSignature":""}')
        .end(done);
    });

    it('should return the default identity from the database, when defined', function(done) {
      helpers.requireBackend('core/esn-config')('identities.default').inModule('linagora.esn.unifiedinbox').store(IDENTITY, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/inbox/identities/default')
          .auth('user1@lng.net', 'secret')
          .expect(200, '{"id":"default","isDefault":true,"name":"Name","email":"user1@lng.net","textSignature":"My signature"}')
          .end(done);
      }));
    });

    it('should return the default identity from the database and merge the user signature, when defined', function(done) {
      const esnConfig = helpers.requireBackend('core/esn-config');

      esnConfig.configurations.updateConfigurations([
        {
          name: 'linagora.esn.unifiedinbox',
          configurations: [
            {
              name: 'identities.default',
              value: {
                textSignature: 'Overriden signature'
              }
            }
          ]
        }
      ], models.domain._id, models.users[0]._id).then(() => {
        esnConfig('identities.default').inModule('linagora.esn.unifiedinbox').store(IDENTITY, this.helpers.callbacks.noErrorAnd(() => {
          request(app)
            .get('/api/inbox/identities/default')
            .auth('user1@lng.net', 'secret')
            .expect(200, '{"id":"default","isDefault":true,"name":"Name","email":"user1@lng.net","textSignature":"Overriden signature"}')
            .end(done);
        }));
      });
    });

    it('should return the default identity from the database when queried by a user with no signature, after a user with a signature', function(done) {
      const esnConfig = helpers.requireBackend('core/esn-config');

      esnConfig.configurations.updateConfigurations([
        {
          name: 'linagora.esn.unifiedinbox',
          configurations: [
            {
              name: 'identities.default',
              value: {
                textSignature: 'Overriden signature'
              }
            }
          ]
        }
      ], models.domain._id, models.users[0]._id).then(() => {
        request(app)
          .get('/api/inbox/identities/default')
          .auth('user1@lng.net', 'secret')
          .expect(200, '{"id":"default","isDefault":true,"description":"My default identity","name":"a user1","email":"user1@lng.net","replyTo":"user1@lng.net","textSignature":"Overriden signature"}')
          .end(() => {
            request(app)
              .get('/api/inbox/identities/default')
              .auth('user2@lng.net', 'secret')
              .expect(200, '{"id":"default","isDefault":true,"description":"My default identity","name":"b user2","email":"user2@lng.net","replyTo":"user2@lng.net","textSignature":""}')
              .end(done);
          });
      });
    });

    it('should return 500 when the identity could not be generated', function(done) {
      helpers.requireBackend('core/esn-config')('identities.default').inModule('linagora.esn.unifiedinbox').store(INVALID_IDENTITY, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/inbox/identities/default')
          .auth('user1@lng.net', 'secret')
          .expect(500)
          .end(done);
      }));
    });

  });

});
