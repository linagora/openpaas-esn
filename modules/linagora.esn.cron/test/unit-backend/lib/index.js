'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;
var sinon = require('sinon');

describe('The Cron Module', function() {

  function _registry(mock) {
    mock = mock || {};

    function store(id, description, job, callback) {
      return callback(null, {id: id, description: description, job: job});
    }

    function get(id, callback) {
      return callback();
    }

    function update(job, callback) {
      return callback(null, job);
    }

    return function() {
      return {
        store: mock.store || store,
        get: mock.get || get,
        update: mock.update || update
      };
    };
  }

  function mockRegistry(registry) {
    registry = registry || {};
    mockery.registerMock('./registry', _registry(registry));
  }

  var deps = {
    logger: {
      error: function() {},
      info: function() {},
      warning: function() {}
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  describe('The module', function() {

    it('should not run the job if already running', function(done) {

      mockRegistry();
      var module = require('../../../lib/index')(dependencies);

      var clock = sinon.useFakeTimers();

      var called = 0;
      var job = function() {
        setTimeout(function() {
          called++;
        }, 1500);
      };

      // first launch will occurs at t0 + 1000 and will finish at t0 + 1000 + 1500
      // second launch will occurs at t0 + 2000
      module.submit('Awesome Job', '* * * * * *', job, function() {
      }, function(err) {
        clock.tick(2900);
        expect(err).to.not.exist;
        expect(called).to.equal(1);
        done();
      });
    });

    it('should update the state of the job', function(done) {

      var states = {
        running: 0,
        complete: 0
      };

      mockRegistry({
        update: function(job, callback) {
          states[job.state] ++;
          return callback();
        },
        get: function(id, callback) {
          return callback(null, {});
        }
      });

      var module = require('../../../lib/index')(dependencies);
      var clock = sinon.useFakeTimers();

      var called = 0;
      var job = function(callback) {
        called++;
        return callback();
      };

      module.submit('Awesome Job', '* * * * * *', job, function() {
      }, function(err) {
        clock.tick(3000);
        expect(err).to.not.exist;
        expect(states.running).to.equal(called);
        expect(states.complete).to.equal(called);
        done();
      });
    });

    it('should set the state as failed when job failed', function(done) {

      var states = {
        running: 0,
        complete: 0,
        failed: 0
      };

      mockRegistry({
        update: function(job, callback) {
          states[job.state] ++;
          return callback();
        },
        get: function(id, callback) {
          return callback(null, {});
        }
      });

      var module = require('../../../lib/index')(dependencies);
      var clock = sinon.useFakeTimers();

      var called = 0;
      var job = function(callback) {
        called++;
        return callback(new Error());
      };

      module.submit('Awesome Job', '* * * * * *', job, function() {
      }, function(err) {
        clock.tick(3000);
        expect(err).to.not.exist;
        expect(states.running).to.equal(called);
        expect(states.complete).to.equal(0);
        expect(states.failed).to.equal(called);
        done();
      });
    });
  });

  describe('The submit function', function() {

    var module;

    beforeEach(function() {
      mockRegistry();
      module = require('../../../lib/index')(dependencies);
    });

    it('should fail is crontime is undefined', function(done) {
      module.submit('Awesome Job', null, function() {
      }, function() {
      }, function(err) {
        expect(err).to.match(/Crontime is required/);
        done();
      });
    });

    it('should fail is job is undefined', function(done) {
      module.submit('Awesome Job', '* * * * *', null, function() {
      }, function(err) {
        expect(err).to.match(/Job is required/);
        done();
      });
    });

    it('should fail is job is not a function', function(done) {
      module.submit('Awesome Job', '* * * * *', {}, function() {
      }, function(err) {
        expect(err).to.match(/Job must be a function/);
        done();
      });
    });

    it('should run the job', function(done) {
      var clock = sinon.useFakeTimers();

      var called = 0;
      var job = function() {
        called++;
      };

      module.submit('Awesome Job', '* * * * * *', job, function() {
      }, function(err) {
        clock.tick(10000);
        expect(err).to.not.exist;
        expect(called > 1).to.be.true;
        done();
      });
    });

    it('should use onStopped as callback if callback is undefined', function(done) {
      var clock = sinon.useFakeTimers();

      var called = false;
      var job = function() {
        called = true;
      };

      module.submit('Awesome Job', '* * * * * *', job, function(err) {
        clock.tick(1000);
        expect(err).to.not.exist;
        expect(called).to.be.true;
        done();
      });
    });

    it('should return the job', function(done) {
      var job = function() {
      };
      var complete = function() {
      };
      var description = 'My Description';

      module.submit(description, '* * * * * *', job, complete, function(err, created) {
        expect(err).to.not.exist;
        expect(created).to.exist;
        expect(created.id).to.exist;
        expect(created.description).to.equals(description);
        expect(created.job).to.exist;
        done();
      });
    });
  });

  describe('The abort function', function() {

    it('should fail if registry fails', function(done) {
      mockRegistry({
        get: function(id, callback) {
          return callback(new Error());
        }
      });
      var module = require('../../../lib/index')(dependencies);
      module.abort('123', function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail if job is not found', function(done) {
      mockRegistry({
        get: function(id, callback) {
          return callback();
        }
      });
      var module = require('../../../lib/index')(dependencies);
      module.abort('123', function(err) {
        expect(err).to.match(/No such job/);
        done();
      });
    });

    it('should fail if job does not have cron job', function(done) {
      mockRegistry({
        get: function(id, callback) {
          return callback(null, {});
        }
      });
      var module = require('../../../lib/index')(dependencies);
      module.abort('123', function(err) {
        expect(err).to.match(/No job to stop/);
        done();
      });
    });

    it('should stop the job', function(done) {
      mockRegistry({
        get: function(id, callback) {
          return callback(null, {
            job: {
              stop: done
            }
          });
        }
      });

      var module = require('../../../lib/index')(dependencies);
      module.abort('123', function() {
      });
    });
  });
});
