'use strict';

const expect = require('chai').expect,
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

  describe('GET /downloads/thunderbird/op-tb-autoconf.xpi', function() {

    let app;

    beforeEach(function() {
      app = require('../../backend/webserver/application')(helpers.modules.current.deps);
    });

    it('should return 401 if not logged in', function(done) {
      helpers.api.requireLogin(app, 'get', '/downloads/thunderbird/op-tb-autoconf.xpi', done);
    });

    it('should return 200 with a ZIP archive', function(done) {
      request(app)
        .get('/downloads/thunderbird/op-tb-autoconf.xpi')
        .auth(user, password)
        .expect(200)
        .then(res => {
          expect(res.text.length).to.be.above(4);
          expect(res.text.substring(0, 4)).to.equal('PK\u0003\u0004'); // https://users.cs.jmu.edu/buchhofp/forensics/formats/pkzip.html

          done();
        });
    });

  });

});
