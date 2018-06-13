'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const q = require('q');

describe('The AMQP config module', function() {

  let helpers;

  function getUrl() {
    return helpers.requireBackend('core/amqp/utils').getUrl();
  }

  function mockEsnConfig(mock) {
    mockery.registerMock('../../core/esn-config', mock || testingEsnConfig());
  }

  function testingEsnConfig() {
    return () => ({
      get: () => q.when({ url: 'amqp://testing-url' })
    });
  }

  beforeEach(function() {
    helpers = this.helpers;
  });

  describe('The getUrl method', function() {

    function buildExpectedUri(envVarName, envVarValue) {
      const urlComponents = {
        AMQP_PROTOCOL: 'amqp',
        AMQP_HOST: 'localhost',
        AMQP_USERNAME: 'guest',
        AMQP_PASSWORD: 'guest',
        AMQP_PORT: '5672'
      };

      urlComponents[envVarName] = envVarValue;

      return [
        urlComponents.AMQP_PROTOCOL, '://', urlComponents.AMQP_USERNAME, ':',
        urlComponents.AMQP_PASSWORD, '@', urlComponents.AMQP_HOST, ':',
        urlComponents.AMQP_PORT
      ].join('');
    }

    function testEnvVariable(varName, done) {
      mockEsnConfig(() => ({
        get: () => q()
      }));
      process.env[varName] = 'testing-env-var';

      const expectedConnectionUri = buildExpectedUri(varName, process.env[varName]);

      getUrl().then(url => {
        expect(url).to.equal(expectedConnectionUri);
        delete process.env[varName];
        done();
      });
    }

    it('should ask for "amqp" key from esnconfig', function(done) {
      mockEsnConfig(key => {
        expect(key).to.equal('amqp');
        done();

        return { get: () => q.reject(new Error()) };
      });

      getUrl();
    });

    it('should use default url when esnconfig does not return amqp configuration', function(done) {
      mockEsnConfig(() => ({
        get: () => q()
      }));

      getUrl().then(url => {
        expect(url).to.equal('amqp://guest:guest@localhost:5672');
        done();
      });
    });

    it('should connect to the server using the expected esnconfig options', function(done) {
      mockEsnConfig();

      getUrl().then(url => {
        expect(url).to.equal('amqp://testing-url');
        done();
      });
    });

    it('should connect to the server using the AMQP_CONNECTION_URI env var', function(done) {
      mockEsnConfig(() => ({
        get: () => q()
      }));

      process.env.AMQP_CONNECTION_URI = 'amqp://testing-amqp-connection-uri-var';

      getUrl().then(url => {
        expect(url).to.equal(process.env.AMQP_CONNECTION_URI);
        delete process.env.AMQP_CONNECTION_URI;
        done();
      });
    });

    it('should read AMQP_PROTOCOL env var to connect', function(done) {
      testEnvVariable('AMQP_PROTOCOL', done);
    });

    it('should read AMQP_HOST env var to connect', function(done) {
      testEnvVariable('AMQP_HOST', done);
    });

    it('should read AMQP_PORT env var to connect', function(done) {
      testEnvVariable('AMQP_PORT', done);
    });

    it('should read AMQP_USERNAME env var to connect', function(done) {
      testEnvVariable('AMQP_USERNAME', done);
    });

    it('should read AMQP_PASSWORD env var to connect', function(done) {
      testEnvVariable('AMQP_PASSWORD', done);
    });

    it('should prefer the config stored in DB over the AMQP_CONNECTION_URI env var to connect', function(done) {
      mockEsnConfig();
      process.env.AMQP_CONNECTION_URI = 'amqp://testing-amqp-connection-uri-var';

      getUrl().then(url => {
        expect(url).to.equal('amqp://testing-url');
        delete process.env.AMQP_CONNECTION_URI;
        done();
      });
    });

    it('should prefer the AMQP_CONNECTION_URI env var over any other to connect', function(done) {
      mockEsnConfig(() => ({
        get: () => q()
      }));
      process.env.AMQP_CONNECTION_URI = 'amqp://testing-amqp-connection-uri-var';
      process.env.AMQP_HOST = 'custom-host';

      getUrl().then(url => {
        expect(url).to.equal(process.env.AMQP_CONNECTION_URI);
        delete process.env.AMQP_CONNECTION_URI;
        delete process.env.AMQP_HOST;
        done();
      });
    });
  });
});
