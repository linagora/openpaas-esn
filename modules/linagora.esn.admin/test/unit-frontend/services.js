'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Admin Domain Configuration service', function() {
  var adminDomainConfigService, session;

  beforeEach(function() {
    this.configs = [
      {
        name: 'mail',
        value: {
          mail: {
            from: 'no-reply@open-paas.org',
            'no-reply': 'no-reply@open-paas.org'
          },
          transport: {
            module: 'nodemailer-browser',
            config: {
              dir: '/tmp',
              browser: false
            }
          },
          from: 'no-reply@open-paas.org'
        }
      }
    ];

    this.domainId = 'domainId';

    angular.mock.module('linagora.esn.admin');
  });

  beforeEach(function() {
    angular.mock.inject(function(_adminDomainConfigService_, $httpBackend, _session_) {
      adminDomainConfigService = _adminDomainConfigService_;
      this.$httpBackend = $httpBackend;
      session = _session_;
    });
  });

  describe('get function', function() {
    it('should return an Error if respose.status is not 200', function(done) {
      var self = this;
      var configNames = ['mail'];

      this.$httpBackend.expectPOST('/admin/api/configuration/' + self.domainId, {configNames: configNames}).respond(500, 'Error');

      adminDomainConfigService.get(self.domainId, configNames)
        .catch(function(err) {
          expect(err).to.exist;
          done();
        });

      this.$httpBackend.flush();
    });

    it('should return an array of configurations of domain if respose.status is 200', function(done) {
      var self = this;
      var configNames = ['mail'];

      this.$httpBackend.expectPOST('/admin/api/configuration/' + self.domainId, {configNames: configNames}).respond(200, self.configs);

      adminDomainConfigService.get(self.domainId, configNames)
        .then(function(configs) {
          expect(configs).to.deep.equal(self.configs);
          done();
        });

      this.$httpBackend.flush();
    });

    it('should return a configuration if configNames is not an array', function(done) {
      var self = this;
      var configNames = 'mail';

      this.$httpBackend.expectPOST('/admin/api/configuration/' + self.domainId, {configNames: [configNames]}).respond(200, self.configs);

      adminDomainConfigService.get(self.domainId, configNames)
        .then(function(config) {
          expect(config).to.deep.equal(self.configs[0].value);
          done();
        });

      this.$httpBackend.flush();
    });
  });

  describe('set function', function() {
    it('should return an Error if respose.status is not 200', function(done) {
      var self = this;

      this.$httpBackend.expectPUT('/admin/api/configuration/' + self.domainId, {configs: self.configs}).respond(500, 'Error');

      adminDomainConfigService.set(self.domainId, self.configs)
        .catch(function(err) {
          expect(err).to.exist;
          done();
        });

      this.$httpBackend.flush();
    });

    it('should return an array of configurations of domain if respose.status is 200', function(done) {
      var self = this;

      this.$httpBackend.expectPUT('/admin/api/configuration/' + self.domainId, {configs: self.configs}).respond(200, self.configs);

      adminDomainConfigService.set(self.domainId, self.configs)
        .then(function(configs) {
          expect(configs).to.deep.equal(self.configs);
          done();
        });

      this.$httpBackend.flush();
    });
  });
});
