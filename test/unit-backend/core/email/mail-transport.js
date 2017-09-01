const mockery = require('mockery');
const expect = require('chai').expect;
const sinon = require('sinon');

describe('The mail-transport module', function() {
  let transportConfig, module, config, transport;

  beforeEach(function() {
    config = {};
    transportConfig = 'The transport configuration';
    transport = 'The transport';
  });

  describe('The get function', function() {
    it('should reject when config is not defined', function(done) {
      module = this.helpers.requireBackend('core/email/mail-transport');
      module.get()
        .then(done)
        .catch(this.helpers.callbacks.errorWithMessage(done, 'Mail configuration is required'));
    });

    it('should reject when config.transport is not defined', function(done) {
      module = this.helpers.requireBackend('core/email/mail-transport');
      module.get(config)
        .then(done)
        .catch(this.helpers.callbacks.errorWithMessage(done, 'Mail transport is not configured'));
    });

    describe('when transport module is defined', function() {
      beforeEach(function() {
        config.transport = { module: 'nodemailer-browser' };
      });

      it('should create transport from given module when defined', function(done) {
        const pluginResult = 'The plugin result';
        const nodeMailPluginSpy = sinon.spy(function() {
          return pluginResult;
        });
        const createTransportSpy = sinon.spy(function() {
          return transport;
        });

        mockery.registerMock(config.transport.module, nodeMailPluginSpy);
        mockery.registerMock('nodemailer', {
          createTransport: createTransportSpy
        });

        module = this.helpers.requireBackend('core/email/mail-transport');
        module.get(config).then(result => {
          expect(result).to.deep.equals(transport);
          expect(nodeMailPluginSpy).to.have.been.calledWith(config.transport.config);
          expect(createTransportSpy).to.have.been.calledWith(pluginResult);
          done();
        }).catch(done);
      });

      it('should reject when plugin can not be loaded from configuration', function(done) {
        const error = new Error('I failed to load!');
        const nodeMailPluginSpy = sinon.spy(function() {
          throw error;
        });
        const createTransportSpy = sinon.spy(function() {
          return transport;
        });

        mockery.registerMock(config.transport.module, nodeMailPluginSpy);
        mockery.registerMock('nodemailer', {
          createTransport: createTransportSpy
        });

        module = this.helpers.requireBackend('core/email/mail-transport');
        module.get(config).then(done).catch(err => {
          expect(err).to.equal(error);
          expect(nodeMailPluginSpy).to.have.been.calledWith(config.transport.config);
          expect(createTransportSpy).to.not.have.been.called;
          done();
        });
      });

      it('should reject when transport creation throws error', function(done) {
        const pluginResult = 'The plugin result';
        const error = new Error('I failed to load!');
        const nodeMailPluginSpy = sinon.spy(function() {
          return pluginResult;
        });
        const createTransportSpy = sinon.spy(function() {
          throw error;
        });

        mockery.registerMock(config.transport.module, nodeMailPluginSpy);
        mockery.registerMock('nodemailer', {
          createTransport: createTransportSpy
        });

        module = this.helpers.requireBackend('core/email/mail-transport');
        module.get(config).then(done).catch(err => {
          expect(err).to.equal(error);
          expect(nodeMailPluginSpy).to.have.been.calledWith(config.transport.config);
          expect(createTransportSpy).to.have.been.calledWith(pluginResult);
          done();
        });
      });
    });

    describe('When transport module is not defined', function() {
      beforeEach(function() {
        config = {
          transport: {
            config: transportConfig
          }
        };
      });

      it('should create transport from configuration', function(done) {
        const createTransportSpy = sinon.spy(function() {
          return transport;
        });

        mockery.registerMock('nodemailer', {
          createTransport: createTransportSpy
        });

        module = this.helpers.requireBackend('core/email/mail-transport');
        module.get(config).then(result => {
          expect(result).to.deep.equals(transport);
          expect(createTransportSpy).to.have.been.calledWith(config.transport.config);
          done();
        }).catch(done);
      });
    });
  });
});
