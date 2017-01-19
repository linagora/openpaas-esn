'use strict';

var mockery = require('mockery');
var expect = require('chai').expect;
var sinon = require('sinon');

describe('The Cron Module', function() {

  function _registry(mock) {
    mock = mock || {};

    function store(id, description, job, context, callback) {
      return callback(null, {
        id: id,
        description: description,
        job: job,
        context: context
      });
    }

    function get(id, callback) {
      return callback();
    }

    function getInMemory() {
      return;
    }

    function update(job, callback) {
      return callback(null, job);
    }

    function remove(id, callback) {
      return callback();
    }

    return function() {
      return {
        store: mock.store || store,
        get: mock.get || get,
        getInMemory: mock.getInMemory || getInMemory,
        storeInMemory: mock.storeInMemory || store,
        update: mock.update || update,
        remove: mock.remove || remove,
        getAll: mock.getAll
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
      warn: function() {},
      debug: function() {}
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  var clock;
  afterEach(function() {
    if (clock) {
      clock.restore();
      clock = null;
    }
  });

  describe('The module', function() {

    it('should not run the job if already running', function(done) {

      clock = sinon.useFakeTimers();
      mockRegistry();
      var module = require('../../../lib/index')(dependencies);

      var called = 0;
      var job = function() {
        setTimeout(function() {
          called++;
        }, 1500);
      };

      // first launch will occurs at t0 + 1000 and will finish at t0 + 1000 + 1500
      // second launch will occurs at t0 + 2000
      module.submit('Awesome Job', '* * * * * *', job, {}, function() {
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
          states[job.state]++;
          return callback();
        },
        get: function(id, callback) {
          return callback(null, {});
        }
      });

      var module = require('../../../lib/index')(dependencies);
      clock = sinon.useFakeTimers();

      var called = 0;
      var job = function(callback) {
        called++;
        return callback();
      };

      module.submit('Awesome Job', '* * * * * *', job, {}, function() {
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
          states[job.state]++;
          return callback();
        },
        get: function(id, callback) {
          return callback(null, {});
        }
      });

      var module = require('../../../lib/index')(dependencies);
      clock = sinon.useFakeTimers();

      var called = 0;
      var job = function(callback) {
        called++;
        return callback(new Error());
      };

      module.submit('Awesome Job', '* * * * * *', job, {}, function() {
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
      clock = sinon.useFakeTimers();
      mockRegistry();
      module = require('../../../lib/index')(dependencies);
    });

    it('should fail is crontime is undefined', function(done) {
      module.submit('Awesome Job', null, function() {}, {}, function(err) {
        expect(err).to.match(/Crontime is required/);
        done();
      });
    });

    it('should fail is job is undefined', function(done) {
      module.submit('Awesome Job', '* * * * *', null, {}, function(err) {
        expect(err).to.match(/Job is required/);
        done();
      });
    });

    it('should fail is job is not a function', function(done) {
      module.submit('Awesome Job', '* * * * *', {}, {}, function() {
      }, function(err) {
        expect(err).to.match(/Job must be a function/);
        done();
      });
    });

    it('should run the job', function(done) {
      var called = 0;
      var job = function() {
        called++;
      };

      module.submit('Awesome Job', '* * * * * *', job, {}, function() {
      }, function(err) {
        clock.tick(10000);
        expect(err).to.not.exist;
        expect(called > 1).to.be.true;
        done();
      });
    });

    it('should use opts as callback if callback is undefined', function(done) {
      var called = false;
      var job = function() {
        called = true;
      };

      module.submit('Awesome Job', '* * * * * *', job, {}, function(err) {
        clock.tick(1000);
        expect(err).to.not.exist;
        expect(called).to.be.true;
        done();
      });
    });

    it('should return the job', function(done) {
      var job = function() {};
      var description = 'My Description';

      module.submit(description, '* * * * * *', job, {}, {}, function(err, created) {
        expect(err).to.not.exist;
        expect(created).to.exist;
        expect(created.id).to.exist;
        expect(created.description).to.equals(description);
        expect(created.job).to.exist;
        done();
      });
    });

    it('should not call the storage in the db by default', function(done) {
      var job = function() {};
      var description = 'My Description';

      var storeSpy = sinon.spy();
      mockRegistry({
        store: storeSpy
      });
      var module = require('../../../lib/index')(dependencies);
      module.submit(description, '* * * * * *', job, {}, {}, function(err, created) {
        expect(err).to.not.exist;
        expect(created).to.exist;
        expect(storeSpy).to.not.have.been.called;
        done();
      });
    });

    it('should call the storage in the db if the option is set', function(done) {
      var job = function() {};
      var description = 'My Description';

      var storeSpy = sinon.spy();
      var storeInMemorySpy = sinon.spy();
      mockRegistry({
        store: storeSpy(function(jobId, description, cronjob, context, callback) {
          callback();
        }),
        storeInMemory: storeInMemorySpy(function(jobId, description, cronjob, context, callback) {
          callback();
        })
      });
      var module = require('../../../lib/index')(dependencies);
      module.submit(description, '* * * * * *', job, {}, {dbStorage: true}, function(err, created) {
        expect(err).to.not.exist;
        expect(created).to.exist;
        expect(storeSpy).to.have.been.called;
        expect(storeInMemorySpy).to.have.been.called;
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

    it('should stop the job if any and delete the job in the registry', function(done) {
      var testId = '123';
      var stopSpy = sinon.spy();
      mockRegistry({
        get: function(id, callback) {
          expect(id).to.equal(testId);
          return callback(null, {
            jobId: testId,
            cronjob: {
              stop: stopSpy
            }
          });
        },
        getInMemory: function(id) {
          expect(id).to.equal(testId);
          return {
            cronjob: {
              stop: stopSpy
            }
          };
        },
        remove: function(id, callback) {
          expect(id).to.equal(testId);
          expect(stopSpy).to.have.been.called;
          callback();
        }
      });

      var module = require('../../../lib/index')(dependencies);
      module.abort(testId, done);
    });
  });

  describe('the reviveJobs function', function() {
    var publishSpy;
    beforeEach(function() {
      publishSpy = sinon.spy();
      deps.pubsub = {
        local: {
          topic: function(event) {
            expect(event).to.equal('cron:job:revival');
            return {
              publish: publishSpy
            };
          }
        }
      };
    });

    it('should not emit if an error happens when searching for jobs in the DB', function(done) {
      mockRegistry({
        getAll: function(callback) {
          return callback(new Error());
        }
      });
      var module = require('../../../lib/index')(dependencies);
      module.reviveJobs(function(err) {
        expect(err).to.exist;
        expect(publishSpy).to.not.have.been.called;
        done();
      });
    });

    it('should emit an event on cron:job:revival for each event not stopped from the DB', function(done) {
      mockRegistry({
        getAll: function(callback) {
          return callback(null, [{jobId: 'id1'}, {jobId: 'id2', state: 'stopped'}, {jobId: 'id3'}]);
        }
      });
      var module = require('../../../lib/index')(dependencies);
      module.reviveJobs(function(err) {
        expect(err).to.not.exist;
        expect(publishSpy).to.have.been.calledTwice;
        done();
      });
    });
  });
});
