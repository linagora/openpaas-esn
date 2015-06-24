'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

describe('The Grace Period Module', function() {

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

  describe('The create function', function() {

    it('should fail when job is undefined', function(done) {
      var module = require('../../../lib/index')(dependencies);
      try {
        module.create(null, 1000);
      } catch (err) {
        expect(err).to.match(/job is required/);
        done();
      }
    });

    it('should fail when delay is undefined', function(done) {
      var module = require('../../../lib/index')(dependencies);
      try {
        module.create(function() {
        });
      } catch (err) {
        expect(err).to.match(/delay is required/);
        done();
      }
    });

    it('should fail when delay is == 0', function(done) {
      var module = require('../../../lib/index')(dependencies);
      try {
        module.create(function() {}, 0);
      } catch (err) {
        expect(err).to.match(/delay is required/);
        done();
      }
    });

    it('should fail when delay is < 0', function(done) {
      var module = require('../../../lib/index')(dependencies);
      try {
        module.create(function() {}, -1);
      } catch (err) {
        expect(err).to.match(/delay must be > 0/);
        done();
      }
    });

    it('should run the job after the given delay', function(done) {

      var module = require('../../../lib/index')(dependencies);

      var clock = sinon.useFakeTimers();
      var job = function() {
        done();
      };
      module.create(job, 1000);
      clock.tick(2000);
    });

    it('should cancel the job if cancel called before the end of the grace period', function(done) {

      var module = require('../../../lib/index')(dependencies);

      var clock = sinon.useFakeTimers();
      var job = function() {
        done(new Error());
      };

      var task = module.create(job, 10000);
      clock.tick(3000);
      task.cancel();
      done();
    });

    it('should call onComplete handler when job is complete', function(done) {

      var module = require('../../../lib/index')(dependencies);

      var clock = sinon.useFakeTimers();
      var job = function(context, cb) {
        cb();
      };

      var onComplete = done();

      var onCancel = function() {
        done(new Error());
      };

      module.create(job, 1000, {}, onComplete, onCancel);
      clock.tick(3000);
    });

    it('should call onCancel handler when job is cancelled before the end of the grace period', function(done) {

      var module = require('../../../lib/index')(dependencies);

      var clock = sinon.useFakeTimers();
      var job = function(context, cb) {
        cb();
      };

      var onComplete = function() {
        done(new Error());
      };

      var task = module.create(job, 2000, {}, onComplete, done);
      clock.tick(1000);
      task.cancel();
    });

    it('should call onCancel handler once', function(done) {

      var module = require('../../../lib/index')(dependencies);

      var clock = sinon.useFakeTimers();
      var job = function() {
      };

      var onCancel = function() {
        done();
      };

      var onComplete = function() {
        done(new Error());
      };

      var task = module.create(job, 2000, {}, onComplete, onCancel);
      clock.tick(500);
      task.cancel();
      clock.tick(500);
      task.cancel();
      // will fail with multiple done call error if something is wrong
    });

    it('should have no effect when cancelling the job after the end of the grace period', function(done) {

      var module = require('../../../lib/index')(dependencies);

      var clock = sinon.useFakeTimers();
      var called = 0;
      var job = function(context, cb) {
        called++;
        cb();
      };

      var onComplete = function() {
        expect(called).to.equal(1);
      };

      var onCancel = function() {
        done(new Error());
      };

      var task = module.create(job, 1000, {}, onComplete, onCancel);
      clock.tick(2000);
      task.cancel();
      done();
    });

    it('should get the input context', function(done) {

      var module = require('../../../lib/index')(dependencies);
      var input = {
        a: 1,
        b: 2
      };

      var clock = sinon.useFakeTimers();
      var job = function(context) {
        expect(context).to.deep.equal(input);
        done();
      };

      module.create(job, 1000, input);
      clock.tick(2000);
    });
  });
});
