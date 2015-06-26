'use strict';

var expect = require('chai').expect;

describe('The Grace Registry Module', function() {

  var deps = {
    logger: {
      error: function() {},
      debug: function() {},
      info: function() {},
      warning: function() {}
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  function getModule() {
    return require('../../../lib/registry')(dependencies);
  }

  describe('The put function', function() {
    it('should reject when id is null', function(done) {
      getModule().put(null, {}).then(function() {done(new Error());}, function() {done();});
    });

    it('should reject when task is null', function(done) {
      getModule().put(123).then(function() {done(new Error());}, function() {done();});
    });

    it('should save task', function(done) {
      getModule().put(123, 456).then(function() {done();}, function() {done(new Error());});
    });
  });

  describe('The get function', function() {

    it('should not fail when task does not exists', function(done) {
      getModule().get(123).then(function(data) {
        expect(data).to.be.undefined;
        done();
      }, function() {
        done(new Error());
      });
    });

    it('should return the task when it exists', function(done) {
      var module = getModule();
      var task = {_id: 123456};
      var id = '873873873873';

      var error = function() {
        done(new Error());
      };

      module.put(id, task).then(function() {
        module.get(id).then(function(data) {
          expect(data).to.deep.equal(data);
          done();
        }, error);
      }, error);
    });
  });

  describe('The remove function', function() {

    it('should not fail when task does not exists', function(done) {
      getModule().remove(123).then(function() {
        done();
      }, function() {
        done(new Error());
      });
    });


    it('should remove the task when it exists', function(done) {
      var module = getModule();
      var task = {_id: 123456};
      var id = '873873873873';

      var error = function() {
        done(new Error());
      };

      module.put(id, task).then(function() {
        module.remove(id).then(function() {
          done();
        }, error);
      }, error);
    });
  });

});
