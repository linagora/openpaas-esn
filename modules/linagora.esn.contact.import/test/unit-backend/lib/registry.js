'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The contact import registry module', function() {

  var deps = {
    logger: {
      debug: console.log,
      info: console.log,
      error: console.log
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  var getModule = function() {
    return require('../../../backend/lib/registry')(dependencies);
  };

  describe('The add function', function() {
    it('should save the importer', function() {
      var module = getModule();
      var importer = {
        name: 'twitter'
      };
      module.add(importer);
      expect(module.list()).to.deep.equal({twitter: importer});
    });

    it('should not save the importer when undefined', function() {
      var module = getModule();
      module.add();
      expect(module.list()).to.be.empty;
    });

    it('should not save the importer when name is undefined', function() {
      var module = getModule();
      module.add({});
      expect(module.list()).to.be.empty;
    });
  });

  describe('The get function', function() {
    it('should get the given importer', function() {
      var module = getModule();
      var name = 'twitter';
      module.add({name: name});
      module.add({name: 'foobbar'});
      expect(module.get(name)).to.deep.equal({name: name});
    });

    it('should not fail when calling with undefined', function() {
      var module = getModule();
      expect(module.get()).to.not.exist;
    });

    it('should send back undefined when not found', function() {
      var module = getModule();
      expect(module.get('foobar')).to.not.exist;
    });
  });
});
