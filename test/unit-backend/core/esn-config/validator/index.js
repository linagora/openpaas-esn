'use strict';

const q = require('q');
const sinon = require('sinon');
const mockery = require('mockery');
const expect = require('chai').expect;

describe('The core/esn-config/validator module', function() {
  let getModule;
  let registryMock;

  beforeEach(function() {
    getModule = () => this.helpers.requireBackend('core/esn-config/validator');

    registryMock = {};
    mockery.registerMock('../registry', registryMock);
  });

  describe('The validate fn', function() {
    beforeEach(function() {
      registryMock.getFromModule = sinon.stub();
    });

    it('should resolve NOK when no module found', function(done) {
      registryMock.getFromModule.returns(null);

      const moduleName = 'mymodule';
      const configName = 'myconfig';
      const configValue = 'myconfigvalue';

      getModule().validate(moduleName, configName, configValue).then(result => {
        expect(result).to.deep.equal({
          ok: false,
          message: `No such module: ${moduleName}`
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
    });

    it('should resolve NOK when no configuration found', function(done) {
      registryMock.getFromModule.returns({
        configurations: {}
      });

      const moduleName = 'mymodule';
      const configName = 'myconfig';
      const configValue = 'myconfigvalue';

      getModule().validate(moduleName, configName, configValue).then(result => {
        expect(result).to.deep.equal({
          ok: false,
          message: `No such configuration ${configName} in module ${moduleName}`
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
    });

    it('should resolve NOK when value is undefined', function(done) {
      const moduleName = 'mymodule';
      const configName = 'myconfig';

      registryMock.getFromModule.returns({
        configurations: { [configName]: {} }
      });

      getModule().validate(moduleName, configName).then(result => {
        expect(result).to.deep.equal({
          ok: false,
          message: 'The value is required'
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
    });

    it('should have default validator which always resolves OK', function(done) {
      const moduleName = 'mymodule';
      const configName = 'myconfig';
      const configValue = 'myconfigvalue';

      registryMock.getFromModule.returns({
        configurations: { [configName]: {} }
      });

      getModule().validate(moduleName, configName, configValue).then(result => {
        expect(result).to.deep.equal({
          ok: true,
          message: null
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
    });

    it('should resolve NOK when custom validator returns error message', function(done) {
      const moduleName = 'mymodule';
      const configName = 'myconfig';
      const configValue = 'myconfigvalue';
      const errorMessage = 'an_error';

      registryMock.getFromModule.returns({
        configurations: {
          [configName]: { validator() { return errorMessage; } }
        }
      });

      getModule().validate(moduleName, configName, configValue).then(result => {
        expect(result).to.deep.equal({
          ok: false,
          message: errorMessage
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
    });

    it('should resolve NOK when custom validator resolves error message', function(done) {
      const moduleName = 'mymodule';
      const configName = 'myconfig';
      const configValue = 'myconfigvalue';
      const errorMessage = 'an_error';

      registryMock.getFromModule.returns({
        configurations: {
          [configName]: { validator() { return q(errorMessage); } }
        }
      });

      getModule().validate(moduleName, configName, configValue).then(result => {
        expect(result).to.deep.equal({
          ok: false,
          message: errorMessage
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
    });

    it('should resolve OK when custom validator returns nothing', function(done) {
      const moduleName = 'mymodule';
      const configName = 'myconfig';
      const configValue = 'myconfigvalue';

      registryMock.getFromModule.returns({
        configurations: {
          [configName]: { validator() { return null; } }
        }
      });

      getModule().validate(moduleName, configName, configValue).then(result => {
        expect(result).to.deep.equal({
          ok: true,
          message: null
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
    });

    it('should resolve OK when custom validator resolves nothing', function(done) {
      const moduleName = 'mymodule';
      const configName = 'myconfig';
      const configValue = 'myconfigvalue';

      registryMock.getFromModule.returns({
        configurations: {
          [configName]: { validator() { return q(null); } }
        }
      });

      getModule().validate(moduleName, configName, configValue).then(result => {
        expect(result).to.deep.equal({
          ok: true,
          message: null
        });
        done();
      })
      .catch(err => done(err || 'should resolve'));
    });

    it('should reject when custom validator rejects', function(done) {
      const moduleName = 'mymodule';
      const configName = 'myconfig';
      const configValue = 'myconfigvalue';

      registryMock.getFromModule.returns({
        configurations: {
          [configName]: { validator() { return q.reject(new Error('an_error')); } }
        }
      });

      getModule().validate(moduleName, configName, configValue)
        .then(() => done('should reject'))
        .catch(err => {
          expect(err.message).to.equal('an_error');
          done();
        });
    });
  });
});
