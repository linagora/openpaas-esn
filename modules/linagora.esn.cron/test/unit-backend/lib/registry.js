'use strict';

var expect = require('chai').expect;
var async = require('async');
var sinon = require('sinon');
var mockery = require('mockery');

describe('The Cron Registry', function() {
  var description = 'My Desc';
  var context = {contextKey: 'contextValue'};
  var job = {};

  var getModule = function() {
    return require('../../../lib/registry')();
  };

  var checkError = function(done, expr) {
    return function(err) {
      expect(err).to.match(expr);
      done();
    };
  };

  var jobModuleMock;

  beforeEach(function() {
    jobModuleMock = {};
    mockery.registerMock('./job', jobModuleMock);
  });

  afterEach(function() {
    jobModuleMock = null;
  });

  describe('The store function', function() {
    it('should fail if jobId is undefined', function(done) {
      getModule().store(null, description, job, context, checkError(done, /id, description and cronjob are required/));
    });

    it('should fail if description is undefined', function(done) {
      getModule().store('id', null, job, context, checkError(done, /id, description and cronjob are required/));
    });

    it('should fail if job is undefined', function(done) {
      getModule().store('id', description, null, context, checkError(done, /id, description and cronjob are required/));
    });

    it('should fail if storage in the db fails', function(done) {
      jobModuleMock.save = function(toSave, callback) {
        expect(toSave).to.deep.equal({
          jobId: 'id',
          description: description,
          context: context
        });

        return callback(new Error('db error'));
      };
      getModule().store('id', description, job, context, checkError(done, /db error/));
    });

    it('should return the job saved in the db', function(done) {
      var savedJob = {
        jobId: 'id',
        description: description,
        context: context
      };

      jobModuleMock.save = function(toSave, callback) {
        expect(toSave).to.deep.equal(savedJob);
        return callback(null, savedJob);
      };

      getModule().store('id', description, job, context, function(err, result) {
        expect(err).to.not.exist;
        var expectedResult = savedJob;
        savedJob.cronjob = job;
        expect(result).to.deep.equal(expectedResult);
        done();
      });
    });

    it('should add cronjob to the job of the registry', function(done) {
      var savedJob = {
        jobId: 'id',
        description: description,
        context: context
      };

      jobModuleMock.save = function(toSave, callback) {
        return callback(null, savedJob);
      };

      var module = getModule();
      module.store('id', description, 'acronjobobject', context, function(err) {
        expect(err).to.not.exist;
        var registryJob = module.getInMemory('id');
        expect(registryJob.cronjob).to.equal('acronjobobject');
        done();
      });
    });
  });

  describe('The storeInMemory function', function() {
    it('should fail if jobId is undefined', function(done) {
      getModule().storeInMemory(null, description, job, context, checkError(done, /id, description and cronjob are required/));
    });

    it('should fail if description is undefined', function(done) {
      getModule().storeInMemory('id', null, job, context, checkError(done, /id, description and cronjob are required/));
    });

    it('should fail if job is undefined', function(done) {
      getModule().storeInMemory('id', description, null, context, checkError(done, /id, description and cronjob are required/));
    });

    it('should add cronjob to the job of the registry', function(done) {
      var job = 'acronjobobject';

      var module = getModule();
      module.storeInMemory('id', description, job, context, function(err, result) {
        expect(err).to.not.exist;
        var expectedJob = {
          jobId: 'id',
          description: description,
          context: context,
          cronjob: job
        };
        expect(result).to.deep.equal(expectedJob);
        var registryJob = module.getInMemory('id');
        expect(registryJob).to.deep.equal(expectedJob);
        done();
      });
    });
  });

  describe('The get function', function() {
    it('should return undefined on undefined id', function(done) {
      getModule().get(null, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.not.exist;
        done();
      });
    });

    it('should fail if the search in the db fails', function(done) {
      var id = '1';

      jobModuleMock.getById = function(wantedId, callback) {
        expect(wantedId).to.equal(id);
        callback(new Error('db error'));
      };

      getModule().get(id, checkError(done, /db error/));
    });

    it('should return undefined on unknown id', function() {
      var id = '1';

      jobModuleMock.getById = function(wantedId, callback) {
        expect(wantedId).to.equal(id);
        callback();
      };

      getModule().get(id, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.not.exist;
      });
    });

    it('should return the registered job', function(done) {
      function save(id, callback) {
        getModule().store(id, description, job, context, callback);
      }

      jobModuleMock.save = function(toSave, callback) {
        return callback(null, toSave);
      };

      var id = '1';

      async.each([id, '2'], function(_id, callback) {
        save(_id, callback);
      }, function() {
        getModule().get(id, function(err, result) {
          expect(err).to.not.exist;
          expect(result).to.exist;
          done();
        });
      });
    });
  });

  describe('The update function', function() {

    it('should fail if job is undefined', function(done) {
      getModule().update(null, checkError(done, /Job is required/));
    });

    it('should fail if job id is undefined', function(done) {
      getModule().update({}, checkError(done, /Job not found/));
    });

    it('should fail if job is not found', function(done) {
      getModule().update({id: 1}, checkError(done, /Job not found/));
    });

    it('should update the entry', function(done) {
      var state = 'yolo';
      var id = 'id';

      jobModuleMock.save = function(toSave, callback) {
        return callback(null, toSave);
      };

      getModule().store(id, description, job, context, function(err, saved) {
        if (err) {
          return done(err);
        }

        saved.state = state;
        getModule().update(saved, function(err, updated) {
          expect(err).to.not.exist;
          expect(updated).to.shallowDeepEqual({
            jobId: id,
            description: description,
            context: context
          });
          done();
        });
      });
    });
  });

  describe('The remove function', function() {
    it('should do nothing if id is undefined', function(done) {
      jobModuleMock.remove = sinon.spy();
      getModule().remove(null, function(err) {
        expect(err).to.not.exist;
        expect(jobModuleMock.remove).to.not.have.been.called;
        done();
      });
    });

    it('should fail if removing the jobs from the db fails', function(done) {
      jobModuleMock.save = function(toSave, callback) {
        return callback(null, toSave);
      };

      var id = '1';
      jobModuleMock.remove = function(_id, callback) {
        expect(_id).to.equal(id);
        return callback(new Error('db fail'));
      };

      var module = getModule();
      module.store(id, description, job, context, function(err, stored) {
        module.remove(stored.jobId, checkError(done, /db fail/));
      });
    });

    it('should remove the jobs from the db', function(done) {
      jobModuleMock.save = function(toSave, callback) {
        return callback(null, toSave);
      };

      var id = '1';
      jobModuleMock.remove = function(_id, callback) {
        expect(_id).to.equal(id);
        return callback();
      };

      var module = getModule();
      module.store(id, description, job, context, function(err, stored) {
        module.remove(stored.jobId, function(err) {
          expect(err).to.not.exist;
          done();
        });
      });
    });
  });
});
