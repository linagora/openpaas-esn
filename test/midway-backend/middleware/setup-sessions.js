'use strict';

const request = require('supertest'),
    expect = require('chai').expect;

describe('The sessions middleware', function() {
  let core, app, helpers;
  let user1, email1;
  const password = 'secret';

  beforeEach(function(done) {
    helpers = this.helpers;
    const self = this;

    core = this.testEnv.initCore(function() {
      self.mongoose = require('mongoose');
      app = helpers.requireBackend('webserver/application');
      helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        user1 = models.users[0];
        email1 = user1.emails[0];

        done();
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  it('should be a MongoDB Session Storage on "connected" event', function(done) {
    const self = this;

    function checkSession(err) {
      if (err) {
        return done(err);
      }
      self.mongoose.connection.collection('sessions').find().toArray(function(err, results) {
        expect(results[0]._id).to.exist;
        var session = results[0].session;
        expect(session).to.exist;
        expect(JSON.parse(session).passport.user).to.equal(email1);
        done();
      });
    }

    request(app)
      .get('/')
      .expect(200);
    setTimeout(function() {
      helpers.api.loginAsUser(app, email1, password, helpers.callbacks.noErrorAnd(() => {
        checkSession();
      }));
    }, 50);
  });

  it('should use new config to generate and validate session if session config changed', function(done) {
    const config = new core['esn-config'].EsnConfig('core');

    helpers.api.loginAsUser(app, email1, password, helpers.callbacks.noErrorAnd(loggedInAsUser => {
      const pubsub = this.helpers.requireBackend('core').pubsub.local;
      const topic = pubsub.topic('webserver:mongosessionstoreEnabled');

      topic.subscribe(function() {
        const req = loggedInAsUser(request(app).get('/api/user'));

        // After updating secret, new secret key should be applied
        // immediately, all existing cookies should becomes invalid,
        // therefore requests with old session ID cookie should be
        // unauthorized.
        req.expect(401).end(err => {
          expect(err).to.not.exist;
          done();
        });
      });

      config.set({
        name: 'session',
        value: {
          secret: 'new secret',
          cookie: {
            maxAge: 20000
          }
        }
      });
    }));
  });
});
