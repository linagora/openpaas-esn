'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The linagora.esn.admin Angular module services', function() {

  describe('The adminDomainConfigService service', function() {

    var $httpBackend;
    var adminDomainConfigService;
    var configsMock, domainId;

    beforeEach(function() {
      configsMock = [
        {
          name: 'mail',
          value: {
            mail: {
              noreply: 'no-reply@open-paas.org'
            },
            transport: {
              module: 'nodemailer-browser',
              config: {
                dir: '/tmp',
                browser: false
              }
            }
          }
        }
      ];

      domainId = 'domainId';

      angular.mock.module('linagora.esn.admin');
    });

    beforeEach(function() {
      angular.mock.inject(function(_adminDomainConfigService_, _$httpBackend_) {
        adminDomainConfigService = _adminDomainConfigService_;
        $httpBackend = _$httpBackend_;
      });
    });

    describe('The get fn', function() {

      it('should return an Error if respose.status is not 200', function(done) {
        var configNames = ['mail'];

        $httpBackend.expectPOST('/admin/api/configuration/' + domainId, {configNames: configNames}).respond(500, 'Error');

        adminDomainConfigService.get(domainId, configNames)
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        $httpBackend.flush();
      });

      it('should return an array of configurations of domain if respose.status is 200', function(done) {
        var configNames = ['mail'];

        $httpBackend.expectPOST('/admin/api/configuration/' + domainId, {configNames: configNames}).respond(200, configsMock);

        adminDomainConfigService.get(domainId, configNames)
          .then(function(configs) {
            expect(configs).to.deep.equal(configsMock);
            done();
          });

        $httpBackend.flush();
      });

      it('should return a configuration if configNames is not an array', function(done) {
        var configNames = 'mail';

        $httpBackend.expectPOST('/admin/api/configuration/' + domainId, {configNames: [configNames]}).respond(200, configsMock);

        adminDomainConfigService.get(domainId, configNames)
          .then(function(config) {
            expect(config).to.deep.equal(configsMock[0].value);
            done();
          });

        $httpBackend.flush();
      });
    });

    describe('The set fn', function() {

      it('should return an Error if respose.status is not 200', function(done) {
        $httpBackend.expectPUT('/admin/api/configuration/' + domainId, {configs: configsMock}).respond(500, 'Error');

        adminDomainConfigService.set(domainId, configsMock)
          .catch(function(err) {
            expect(err).to.exist;
            done();
          });

        $httpBackend.flush();
      });

      it('should return an array of configurations of domain if respose.status is 200', function(done) {
        $httpBackend.expectPUT('/admin/api/configuration/' + domainId, {configs: configsMock}).respond(200, configsMock);

        adminDomainConfigService.set(domainId, configsMock)
          .then(function(configs) {
            expect(configs).to.deep.equal(configsMock);
            done();
          });

        $httpBackend.flush();
      });

      it('should still work if configs parameter as an object', function(done) {
        $httpBackend.expectPUT('/admin/api/configuration/' + domainId, {configs: configsMock}).respond(200, configsMock);

        adminDomainConfigService.set(domainId, configsMock[0])
          .then(function(configs) {
            expect(configs).to.deep.equal(configsMock);
            done();
          });

        $httpBackend.flush();
      });
    });
  });

});
