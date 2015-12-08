'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('The contact import backend module', function() {

  describe('The addImporter function', function() {
    var deps;

    var dependencies = function(name) {
      return deps[name];
    };

    var getModule = function() {
      return require('../../../backend/lib/index')(dependencies);
    };

    beforeEach(function() {
      deps = {
        logger: {
          debug: console.log,
          info: console.log,
          error: console.log
        }
      };
    });

    it('should not add importer when undefined', function() {
      var angularSpy = sinon.spy();
      var addAppSpy = sinon.spy();
      var getStaticAppSpy = sinon.spy();

      mockery.registerMock('../webserver', function() {
        return {
          getStaticApp: getStaticAppSpy
        };
      });

      deps['webserver-wrapper'] = {
        injectAngularModules: angularSpy,
        addApp: addAppSpy
      };

      getModule().addImporter();
      expect(getStaticAppSpy).to.not.have.been.called;
      expect(angularSpy).to.not.have.been.called;
      expect(addAppSpy).to.not.have.been.called;
    });

    it('should create a webapp when importer is defined', function() {

      var angularSpy = sinon.spy();
      var addAppSpy = sinon.spy();
      var getStaticAppSpy = sinon.spy();

      var importer = {
        name: 'twitter',
        frontend: {
          modules: ['app.js', 'services.js'],
          moduleName: 'linagora.esn.contact.import.twitter',
          staticPath: '/foo/bar/baz/twitter'
        }
      };

      mockery.registerMock('../webserver', function() {
        return {
          getStaticApp: getStaticAppSpy
        };
      });

      deps['webserver-wrapper'] = {
        injectAngularModules: angularSpy,
        addApp: addAppSpy
      };

      getModule().addImporter(importer);
      expect(getStaticAppSpy).to.have.been.calledOnce;
      expect(angularSpy).to.have.been.calledOnce;
      expect(addAppSpy).to.have.been.calledOnce;
    });
  });
});
