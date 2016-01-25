'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The workers lib module', function() {

  var deps = {
    logger: {
      debug: function() {},
      info: function() {},
      error: function() {}
    }
  };

  var noop = function() {};

  var dependencies = function(name) {
    return deps[name];
  };

  var getModule = function() {
    return require('../../../backend/lib/workers')(dependencies);
  };

  describe('The add function', function() {
    it('should save the worker', function() {
      var module = getModule();
      var worker = {
        name: 'worker1',
        getWorkerFunction: function() {
          return noop;
        }
      };
      module.add(worker);
      expect(module.list()).to.deep.equal({worker1: worker});
    });

    it('should not save the worker when undefined', function() {
      var module = getModule();
      module.add();
      expect(module.list()).to.be.empty;
    });

    it('should not save the worker when name is undefined', function() {
      var module = getModule();
      module.add({});
      expect(module.list()).to.be.empty;
    });

    it('should not save the worker when getWorkerFunction is not function', function() {
      var module = getModule();
      module.add({getWorkerFunction: 1});
      expect(module.list()).to.be.empty;
    });

    it('should not save the worker when getWorkerFunction result is not a function', function() {
      var module = getModule();
      module.add({getWorkerFunction: noop});
      expect(module.list()).to.be.empty;
    });
  });

  describe('The get function', function() {
    it('should get the given worker', function() {
      var module = getModule();
      var worker1 = {
        name: 'importer',
        getWorkerFunction: function() {
          return noop;
        }
      };
      var worker2 = {
        name: 'foobbar',
        getWorkerFunction: function() {
          return noop;
        }
      };
      module.add(worker1);
      module.add(worker2);
      expect(module.get('importer')).to.deep.equal(worker1);
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
