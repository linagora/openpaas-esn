'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

describe('The invitation core module', function() {

  describe('The init method', function() {
    it('should fail on missing invitation', function(done) {
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.init(null, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail on missing invitation type', function(done) {
      var i = {data: {foo: 'bar'}};
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.init(i, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail on unknown invitation type', function(done) {
      var i = {type: 'foobar', data: {foo: 'bar'}};
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.init(i, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should publish an event on failure', function(done) {
      var handler = {
        init: function(invitation, cb) {
          return cb(new Error('Fail'));
        },
        process: function(invitation, data, done) {
          return done(null, true);
        }
      };

      mockery.registerMock('./handlers/foobar', handler);

      var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
      pubsub.topic('invitation:init:failure').subscribe(function(data) {
        done();
      });
      var i = {type: 'foobar', data: {foo: 'bar'}};
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.init(i, function(err, result) {
        expect(err).to.exist;
      });
    });

    it('should publish an event on success', function(done) {
      var handler = {
        init: function(invitation, cb) {
          return cb(null, {});
        },
        process: function(invitation, data, done) {
          return done(null, true);
        }
      };

      mockery.registerMock('./handlers/foobarbaz', handler);

      var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
      pubsub.topic('invitation:init:success').subscribe(function(data) {
        done();
      });

      var i = {type: 'foobarbaz', data: {foo: 'bar'}};
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.init(i, function(err, result) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The process method', function() {
    it('should fail when invitation is not set', function(done) {
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      var invit = {};
      var data = {};
      invitation.process(invit, data, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call the default console handler', function(done) {
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      var i = {
        type: 'console'
      };
      var data = {};
      invitation.process(i, data, function(err, result) {
        // next has been called by the console handler
        expect(err).to.not.exist;
        done();
      });
    });

    it('should call the injected handler', function(done) {
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');

      var handler = {
        init: function(invitation, cb) {
          return cb();
        },
        process: function(invitation, data, done) {
          return done(null, true);
        }
      };

      mockery.registerMock('./handlers/test', handler);
      mockery.registerMock('../../../../backend/core/invitation/handlers/test', handler);

      var i = {
        type: 'test',
        data: {
          foo: 'bar'
        }
      };

      invitation.process(i, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });

    it('should publish an event on failure', function(done) {
      var handler = {
        init: function(invitation, cb) {
          return cb(null, {});
        },
        process: function(invitation, data, done) {
          return done(new Error('Fail'), true);
        }
      };

      mockery.registerMock('./handlers/foobar', handler);

      var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
      pubsub.topic('invitation:process:failure').subscribe(function(data) {
        done();
      });
      var i = {type: 'foobar', data: {foo: 'bar'}};
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.process(i, {}, function(err, result) {
        expect(err).to.exist;
      });
    });

    it('should publish an event on success', function(done) {
      var handler = {
        init: function(invitation, cb) {
          return cb(null, {});
        },
        process: function(invitation, data, done) {
          return done(null, true);
        }
      };

      mockery.registerMock('./handlers/foobar', handler);

      var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
      pubsub.topic('invitation:process:success').subscribe(function(data) {
        done();
      });
      var i = {type: 'foobar', data: {foo: 'bar'}};
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.process(i, {}, function(err, result) {
        expect(err).to.not.exist;
      });
    });
  });

  describe('The validate method', function() {
    it('should fail when input is null', function(done) {
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.validate(null, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail when input type is null', function(done) {
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      invitation.validate({}, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call the handler to validate the data', function(done) {
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      var called = false;
      var handler = {
        validate: function(invitation, cb) {
          called = true;
          cb(null, true);
        }
      };

      mockery.registerMock('./handlers/validatetest', handler);
      mockery.registerMock('../../../../backend/core/invitation/handlers/validatetest', handler);

      invitation.validate({type: 'validatetest'}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });

  describe('The finalize method', function() {

    it('should call the handler to finalize the request', function(done) {
      var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
      var handler = {
        finalize: function(invitation, data, done) {
          return done(null, true);
        }
      };

      var i = {
        type: 'finalizetest'
      };
      var data = {
        body: {
          foo: 'bar'
        }
      };

      mockery.registerMock('./handlers/finalizetest', handler);
      mockery.registerMock('../../../../backend/core/invitation/handlers/finalizetest', handler);

      invitation.finalize(i, data, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.true;
        done();
      });
    });
  });

  it('should publish an event on failure', function(done) {
    var handler = {
      finalize: function(invitation, data, done) {
        return done(new Error('Fail'), true);
      }
    };

    mockery.registerMock('./handlers/foobar', handler);

    var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
    pubsub.topic('invitation:finalize:failure').subscribe(function(data) {
      done();
    });
    var i = {type: 'foobar', data: {foo: 'bar'}};
    var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
    invitation.finalize(i, {}, function(err, result) {
      expect(err).to.exist;
    });
  });

  it('should publish an event on success', function(done) {
    var handler = {
      finalize: function(invitation, data, done) {
        return done(null, true);
      }
    };

    mockery.registerMock('./handlers/foobar', handler);

    var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
    pubsub.topic('invitation:finalize:success').subscribe(function(data) {
      done();
    });
    var i = {type: 'foobar', data: {foo: 'bar'}};
    var invitation = require(this.testEnv.basePath + '/backend/core/invitation');
    invitation.finalize(i, {}, function(err, result) {
      expect(err).to.not.exist;
    });
  });
});
