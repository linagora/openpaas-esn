'use strict';

var expect = require('chai').expect;

describe('The user login module', function() {

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });


  it('the success fn should reset the login failure counter', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    user.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var login = require('../../../../backend/core/user/login');
      login.success(saved.emails[0], function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.login.failures[0]).to.not.exist;
        done();
      });
    });
  });

  it('the success fn should set the login success field', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    user.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var login = require('../../../../backend/core/user/login');
      login.success(saved.emails[0], function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.login.success).to.exist;
        done();
      });
    });
  });

  it('the failure fn should increment the login failure counter', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com']});
    user.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var login = require('../../../../backend/core/user/login');
      login.failure(saved.emails[0], function(err, data) {
        expect(err).to.not.exist;
        expect(data.login.failures.length).to.equal(1);
        done();
      });
    });
  });

  it('the canLogin fn should return true if size is lower than configured value', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    user.save(function(err, u) {
      if (err) {
        return done(err);
      }

      var conf = require('../../../../backend/core')['esn-config']('login');
      conf.store({ failure: { size: 2}}, function(err, saved) {
        if (err) {
          return done(err);
        }

        var login = require('../../../../backend/core/user/login');
        login.canLogin(u.emails[0], function(err, status) {
          expect(err).to.not.exist;
          expect(status).to.be.true;
          done();
        });
      });
    });
  });

  it('the canLogin fn should return false if size is equal to configured value', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date(), new Date()]}});
    user.save(function(err, u) {
      if (err) {
        return done(err);
      }

      var conf = require('../../../../backend/core')['esn-config']('login');
      conf.store({ failure: { size: 2}}, function(err, saved) {
        if (err) {
          return done(err);
        }

        var login = require('../../../../backend/core/user/login');
        login.canLogin(u.emails[0], function(err, status) {
          expect(err).to.not.exist;
          expect(status).to.be.false;
          done();
        });
      });
    });
  });

  it('the canLogin fn should return false if size is greater than default value', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date(), new Date(), new Date()]}});
    user.save(function(err, u) {
      if (err) {
        return done(err);
      }

      var conf = require('../../../../backend/core')['esn-config']('login');
      conf.store({ failure: { size: 2}}, function(err, saved) {
        if (err) {
          return done(err);
        }

        var login = require('../../../../backend/core/user/login');
        login.canLogin(u.emails[0], function(err, status) {
          expect(err).to.not.exist;
          expect(status).to.be.false;
          done();
        });
      });
    });
  });

  it('should receive a local notification on user login success', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    var count = 0;
    user.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var pubsub = require('../../../../backend/core/pubsub').local;
      var topic = pubsub.topic('login:success');
      var handler = function(user) {
        count++;
      };
      topic.subscribe(handler);

      var login = require('../../../../backend/core/user/login');
      login.success(saved.emails[0], function(err, data) {
        expect(err).to.not.exist;
        process.nextTick(function() {
          expect(count).to.equal(1);
          done();
        });
      });
    });
  });

  it('should receive a local notification on user login failure', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var user = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    var count = 0;
    user.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var pubsub = require('../../../../backend/core/pubsub').local;
      var topic = pubsub.topic('login:failure');
      var handler = function(user) {
        count++;
      };
      topic.subscribe(handler);

      var login = require('../../../../backend/core/user/login');
      login.failure(saved.emails[0], function(err, data) {
        expect(err).to.not.exist;
        process.nextTick(function() {
          expect(count).to.equal(1);
          done();
        });
      });
    });
  });
});
