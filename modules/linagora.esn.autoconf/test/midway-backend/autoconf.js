'use strict';

const request = require('supertest'),
      fs = require('fs'),
      path = require('path');

describe('The Autoconf module API', function() {

  let helpers, models;

  beforeEach(function(done) {
    helpers = this.helpers;

    helpers.modules.initMidway('linagora.esn.autoconf', helpers.callbacks.noErrorAnd(() => {
      helpers.api.applyDomainDeployment('linagora_test_domain', helpers.callbacks.noErrorAnd(deployedModels => {
        models = deployedModels;

        done();
      }));
    }));
  });

  afterEach(function(done) {
    helpers.api.cleanDomainDeployment(models, done);
  });

  describe.skip('GET /api/user/autoconf', function() {

    function loadJSONFixture(basePath, filename) {
      return JSON.parse(fs.readFileSync(path.resolve(basePath, 'modules/linagora.esn.autoconf/test/fixtures/autoconf', filename), 'utf-8'));
    }

    let app;

    beforeEach(function() {
      app = require('../../backend/webserver/application')(helpers.modules.current.deps);
    });

    it('should return 401 if the user is not authenticated', function(done) {
      request(app)
        .get('/api/user/autoconf')
        .expect(401)
        .end(done);
    });

    it('should return 500 if there is no configuration file in database', function(done) {
      request(app)
        .get('/api/user/autoconf')
        .auth('user1@lng.net', 'secret')
        .expect(500)
        .end(done);
    });

    it('should return 200 with a configuration file for the user', function(done) {

      const conf = [
        {
          name: 'autoconf',
          value: loadJSONFixture(this.testEnv.basePath, 'autoconf.json')},
        {
          name: 'davserver',
          value: loadJSONFixture(this.testEnv.basePath, 'davserver.json')}
      ];

      this.helpers.requireBackend('core/esn-config')('*').inModule('core')
      .storeMultiple(conf, this.helpers.callbacks.noErrorAnd(() => {
        request(app)
          .get('/api/user/autoconf')
          .auth('user1@lng.net', 'secret')
          .expect(200, loadJSONFixture(this.testEnv.basePath, 'autoconf-rendered.json'))
          .end(done);
      }));
    });

    it('should transform the config with registered transformers', function(done) {
      const autoconf = helpers.modules.current.lib;

      const conf = [
        {
          name: 'autoconf',
          value: loadJSONFixture(this.testEnv.basePath, 'autoconf.json')},
        {
          name: 'davserver',
          value: loadJSONFixture(this.testEnv.basePath, 'davserver.json')}
      ];

      autoconf.addTransformer({
        transform: config => {
          config.transformer1 = 'value';
        }
      });
      autoconf.addTransformer({
        transform: (config, user) => {
          config.transformer2 = {
            passed: true,
            userLastname: user.lastname
          };
        }
      });

      this.helpers.requireBackend('core/esn-config')('*').inModule('core')
        .storeMultiple(conf, this.helpers.callbacks.noErrorAnd(() => {
          request(app)
            .get('/api/user/autoconf')
            .auth('user1@lng.net', 'secret')
            .expect(200, loadJSONFixture(this.testEnv.basePath, 'autoconf-rendered-transformed.json'))
            .end(done);
      }));
    });

  });

});
