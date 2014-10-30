'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('the webserver-wrapper', function() {
  var module;

  function getApi(module, callback) {
    module.settings.lib([], function(err, api) {
      return callback(err, api);
    });
  }

  it('should expose some methods', function() {
    mockery.registerMock('./', {});
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      expect(api.injectJS).to.exist;
      expect(api.injectJS).to.be.a.function;
      expect(api.injectCSS).to.exist;
      expect(api.injectCSS).to.be.a.function;
      expect(api.addApp).to.exist;
      expect(api.addApp).to.be.a.function;
    });
  });

  it('should webserver.addJSInjection with a formatted data', function(done) {
    var webserverMock = {
      webserver: {
        addJSInjection: function(namespace, injection) {
          expect(namespace).to.equal('myModule');
          expect(injection).to.deep.equal({ 'mymodule.js': ['esn', 'welcome'] });
          done();
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectJS('myModule', 'mymodule.js', ['esn', 'welcome']);
    });
  });

  it('should webserver.addCSSInjection with a formatted data', function(done) {
    var webserverMock = {
      webserver: {
        addCSSInjection: function(namespace, injection) {
          expect(namespace).to.equal('myModule');
          expect(injection).to.deep.equal({ 'mymodule.css': ['esn', 'welcome'] });
          done();
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.injectCSS('myModule', 'mymodule.css', ['esn', 'welcome']);
    });
  });

  it('should call webserver.application.use', function(done) {
    var webserverMock = {
      webserver: {
        application: {
          use: function(baseUri) {
            expect(baseUri).to.equal('/myModule');
            done();
          }
        }
      }
    };
    mockery.registerMock('./', webserverMock);
    module = require(this.testEnv.basePath + '/backend/webserver/webserver-wrapper');
    getApi(module, function(err, api) {
      api.addApp('myModule', 'module');
    });
  });
});
