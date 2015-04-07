'use strict';

var expect = require('chai').expect;
var async = require('async');

describe('The Cron Registry', function() {

  var module;
  var id = '123';
  var description = 'My Desc';
  var job = {
    task: function() {}
  };

  beforeEach(function() {
    module = require('../../../lib/registry')();
  });

  var checkError = function(done, expr) {
    return function(err) {
      expect(err).to.match(expr);
      done();
    };
  };

  describe('The store function', function() {

    it('should fail if id is undefined', function(done) {
      module.store(null, description, job, checkError(done, /id, description and job are required/));
    });

    it('should fail if description is undefined', function(done) {
      module.store(id, null, job, checkError(done, /id, description and job are required/));
    });

    it('should fail if description is job', function(done) {
      module.store(id, description, null, checkError(done, /id, description and job are required/));
    });

    it('should return the saved job', function(done) {
      module.store(id, description, job, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.id).to.equal(id);
        expect(result.description).to.equal(description);
        expect(result.job).to.equal(job);
        done();
      });
    });
  });

  describe('The get function', function() {
    it('should return undefined on undefined id', function() {
      module.get(null, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.not.exist;
      });
    });

    it('should return undefined on unknown id', function() {
      module.get('1', function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.not.exist;
      });
    });

    it('should return the registered job', function() {
      function save(id, callback) {
        module.store(id, description, job, callback);
      }

      async.each(['1', '2'], function(id, callback) {
        save(id, callback);
      }, function() {
        module.get('1', function(err, result) {
          expect(err).to.not.exist;
          expect(result).to.exist;
        });
      });
    });
  });

  describe('The update function', function() {

    it('should fail on if job is undefined', function(done) {
      module.update(null, checkError(done, /Job is required/));
    });

    it('should fail on if job id is undefined', function(done) {
      module.update({}, checkError(done, /Job not found/));
    });

    it('should fail on if job id is not found', function(done) {
      module.update({id: 1}, checkError(done, /Job not found/));
    });

    it('should update the entry', function(done) {
      var state = 'yolo';
      module.store(id, description, job, function(err, saved) {
        if (err) {
          return done(err);
        }

        saved.state = state;
        module.update(saved, function(err, updated) {
          expect(err).to.not.exist;
          expect(updated.state).to.equal(state);
          done();
        });
      });
    });
  });
});
