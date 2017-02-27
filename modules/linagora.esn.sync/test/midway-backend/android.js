'use strict';

const fs = require('fs'),
      path = require('path'),
      expect = require('chai').expect,
      request = require('supertest');

describe('The Sync module', function() {

  const user = 'itadmin@lng.net',
        password = 'secret';

  let helpers, models;

  beforeEach(function(done) {
    helpers = this.helpers;

    helpers.modules.initMidway('linagora.esn.sync', helpers.callbacks.noErrorAnd(() => {
      helpers.api.applyDomainDeployment('linagora_IT', helpers.callbacks.noErrorAnd(deployedModels => {
        models = deployedModels;

        done();
      }));
    }));
  });

  afterEach(function(done) {
    helpers.api.cleanDomainDeployment(models, done);
  });

  function loadJSONFixture(basePath, filename) {
    return JSON.parse(fs.readFileSync(path.resolve(basePath, 'modules/linagora.esn.autoconf/test/fixtures/autoconf', filename), 'utf-8'));
  }

  describe('GET /android/guide', function() {

    let app;

    beforeEach(function() {
      app = require('../../backend/webserver/application')(helpers.modules.current.deps);
    });

    it('should return 401 if not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/android/guide', done);
    });

    it('should return 500 when there is no autoconf document in database', function(done) {
      request(app)
        .get('/android/guide')
        .auth(user, password)
        .expect(500, done);
    });

    it('should return 200 with the english HTML document if no specific locale is requested', function(done) {
      this.helpers.requireBackend('core/esn-config')('autoconf')
        .inModule('core')
        .store(loadJSONFixture(this.testEnv.basePath, 'autoconf.json'), this.helpers.callbacks.noErrorAnd(() => {
          request(app)
            .get('/android/guide')
            .auth(user, password)
            .expect(200)
            .then(res => {
              expect(res.text.substring(0, 31)).to.equal('<h2 id="email-synchronization">');

              done();
            });
        }));
    });

    it('should return 200 with a localized HTML document, if the translation exists', function(done) {
      this.helpers.requireBackend('core/esn-config')('autoconf')
        .inModule('core')
        .store(loadJSONFixture(this.testEnv.basePath, 'autoconf.json'), this.helpers.callbacks.noErrorAnd(() => {
          request(app)
            .get('/android/guide')
            .set('Accept-Language', 'fr-FR')
            .auth(user, password)
            .expect(200)
            .then(res => {
              expect(res.text.substring(0, 38)).to.equal('<h2 id="synchronisation-des-courriels"');

              done();
            });
        }));
    });

    it('should return 200 with the english HTML document, if the translation does not exist', function(done) {
      this.helpers.requireBackend('core/esn-config')('autoconf')
        .inModule('core')
        .store(loadJSONFixture(this.testEnv.basePath, 'autoconf.json'), this.helpers.callbacks.noErrorAnd(() => {
          request(app)
            .get('/android/guide')
            .set('Accept-Language', 'zz')
            .auth(user, password)
            .expect(200)
            .then(res => {
              expect(res.text.substring(0, 31)).to.equal('<h2 id="email-synchronization">');

              done();
            });
        }));
    });

    it('should return 200 with a HTML document with user and config variables replaced', function(done) {
      this.helpers.requireBackend('core/esn-config')('autoconf')
        .inModule('core')
        .store(loadJSONFixture(this.testEnv.basePath, 'autoconf.json'), this.helpers.callbacks.noErrorAnd(() => {
          request(app)
            .get('/android/guide')
            .auth(user, password)
            .expect(200)
            .then(res => {
              expect(res.text).to.contain('openpaas.linagora.com'); // IMAP
              expect(res.text).to.contain('smtp.linagora.com'); // SMTP
              expect(res.text).to.contain(user); // User's email address

              done();
            });
        }));
    });

  });

});
