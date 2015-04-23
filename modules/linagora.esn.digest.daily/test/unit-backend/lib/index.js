'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The Daily Digest Module', function() {

  var module;
  function submit(a, b, c, d, callback) {
    return callback();
  }

  var cron = {
    submit: submit
  };
  var config = {};

  var deps = {
    config: function() {return config;},
    cron: cron,
    logger: {
      error: function() {},
      info: function() {},
      warning: function() {}
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };


  describe('The init function', function() {

    beforeEach(function() {
      mockery.registerMock('./daily', function() {});
      module = require('../../../lib/index')(dependencies);
    });

    it('should not submit the job if cron is defined as not active', function(done) {
      config = {
        dailydigest: {
          active: false
        }
      };

      cron.submit = function() {
        done(new Error());
      };
      module.init(done);
    });

    it('should submit the job to the cron module', function(done) {
      var expression = '123';
      var description = 'My Awesome ESN';

      config = {
        dailydigest: {
          active: true,
          expression: expression,
          description: description
        }
      };

      cron.submit = function(desc, exp, job, onComplete, callback) {
        expect(desc).to.equal(description);
        expect(exp).to.equal(expression);
        expect(job).to.be.a.function;
        expect(onComplete).to.be.a.function;
        expect(callback).to.be.a.function;
        done();
      };
      module.init(function(err) {
        done(err);
      });
    });

    it('should send back error on submit failure', function(done) {
      config = {
        dailydigest: {
          active: true
        }
      };

      cron.submit = function(desc, exp, job, onComplete, callback) {
        return callback(new Error());
      };

      module.init(function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should not send back error on submit success', function(done) {
      config = {
        dailydigest: {
          active: true
        }
      };

      cron.submit = function(desc, exp, job, onComplete, callback) {
        return callback(null, {id: '123', description: '1234'});
      };

      module.init(function(err) {
        expect(err).to.not.exist;
        done();
      });
    });
  });
});
