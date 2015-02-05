'use strict';

var expect = require('chai').expect,
    request = require('supertest'),
    mockery = require('mockery');
var fs = require('fs-extra');

describe('The invitation controller', function() {
  var Invitation;

  describe('POST /api/invitations', function() {
    var webserver = null;
    var handler = {
      init: function(invitation, cb) {
        return cb(null, invitation);
      },
      process: function(req, res, next) {
        return next(null, true);
      },
      validate: function(invitation, cb) {
        if (!invitation) {
          return cb(new Error('invitation is null'));
        }
        if (!invitation.type) {
          return cb(new Error('type is null'));
        }
        return cb(null, true);
      },
      bar: function() {

      }
    };

    beforeEach(function() {
      this.mongoose = require('mongoose');
      this.testEnv.initCore();
      mockery.registerMock('../../core/invitation', handler);
      webserver = this.helpers.requireBackend('webserver').webserver;
      this.helpers.requireBackend('core/db/mongo/models/invitation');
      Invitation = this.mongoose.model('Invitation');
    });

    afterEach(function(done) {
      this.mongoose.disconnect(done);
    });

    it('should fail on empty payload', function(done) {
      request(webserver.application).post('/api/invitations').expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on missing type', function(done) {
      request(webserver.application).post('/api/invitations').send({name: 'openpaas'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on any other JSON data', function(done) {
      request(webserver.application).post('/api/invitations').send({ foo: 'bar', baz: 1}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should save the invitation', function(done) {
      var invitation = { type: 'test', data: {}};
      request(webserver.application).post('/api/invitations').send(invitation).expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        expect(res.body.uuid).to.be.not.null;
        done();
      });
    });
  });

  describe('PUT /api/invitations/:uuid', function() {
    var webserver = null;
    var called = false;
    var handler = {
      isStillValid: function(invitation, done) {
        return done(null, true);
      },
      finalize: function(invitation, data, done) {
        called = true;
        return done(null, true);
      }
    };

    beforeEach(function() {
      this.testEnv.initCore();
      this.mongoose = require('mongoose');
      mockery.registerMock('../../core/invitation', handler);
      webserver = this.helpers.requireBackend('webserver').webserver;
      this.helpers.requireBackend('core/db/mongo/models/invitation');
      Invitation = this.mongoose.model('Invitation');
    });

    afterEach(function(done) {
      this.mongoose.disconnect(done);
    });

    it('should fail if UUID is unknown', function(done) {
      var data = { foo: 'bar'};
      request(webserver.application).put('/api/invitations/123456789').send(data).expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should finalize the invitation process', function(done) {
      var json = {type: 'finalizetest'};
      var i = new Invitation(json);
      i.save(function(err, invitation) {
        if (err) {
          return done(err);
        }
        var data = { foo: 'bar'};
        request(webserver.application).put('/api/invitations/' + invitation.uuid).send(data).expect(201).end(function(err, res) {
          expect(err).to.be.null;
          expect(called).to.be.true;
          done();
        });
      });
    });
  });

  describe('GET /api/invitations', function() {
    var webserver = null;

    beforeEach(function(done) {
      this.testEnv.initCore(function() {
        this.mongoose = require('mongoose');
        Invitation = this.mongoose.model('Invitation');
        webserver = this.helpers.requireBackend('webserver').webserver;
        done();
      }.bind(this));
    });

    afterEach(function(done) {
      this.mongoose.disconnect(done);
    });

    it('should return 404 on root resource', function(done) {
      request(webserver.application).get('/api/invitations').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 404 on unknown resource', function(done) {
      request(webserver.application).get('/api/invitations/123').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return invitation for valid UUID', function(done) {
      var handler = {
        init: function(invitation, cb) {
          return cb();
        },
        process: function(invitation, data, done) {
          return done(null, true);
        },
        isStillValid: function(invitation, callback) {
          return callback(null, true);
        }
      };

      mockery.registerMock('./handlers/test', handler);
      mockery.registerMock('../../../../backend/core/invitation/handlers/test', handler);

      var json = {type: 'test'};
      var i = new Invitation(json);
      i.save(function(err, invitation) {
        if (err) {
          return done(err);
        }
        request(webserver.application).get('/api/invitations/' + invitation.uuid).expect(200).end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body).to.exist;
          expect(res.body.uuid).to.equals(invitation.uuid);
          expect(res.body.type).to.equals(json.type);
          done();
        });
      });
    });
  });

  describe('GET /api/invitation/:uuid', function() {

    beforeEach(function(done) {
      var self = this;
      var mailTransport = {
        _id: 'mail',
        mail: { noreply: 'noreply@linagora.com' },
        transport: {
          type: 'Pickup',
          config: {directory: this.testEnv.tmp}
        }
      };

      fs.copySync(this.testEnv.fixtures + '/default.mongoAuth.json', this.testEnv.tmp + '/default.json');
      var core = this.testEnv.initCore(function() {
        core.pubsub.local.topic('mongodb:connectionAvailable').subscribe(function() {
          self.helpers.mongo.saveDoc('configuration', mailTransport, function(err) {
            if (err) { return done(err); }
            self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
              if (err) { return done(err); }
              self.models = models;
              done();
            });
          });
        });
      });
      this.core = core;
    });

    afterEach(function(done) {
      var self = this;
      require('async').parallel([
        function(done) {
          self.helpers.api.cleanDomainDeployment(self.models, done);
        },
        function(done) {
          self.helpers.mongo.clearCollection('invitations', done);
        }
      ], done);
    });
    afterEach(function(done) {
      this.mongoose.disconnect(done);
    });

    it('should return 404 for an unknown invitation', function(done) {
      this.app = this.helpers.requireBackend('webserver/application');
      request(this.app)
      .get('/api/invitation/' + 'Idontexist')
      .expect(404)
      .end(done);
    });

    it('should return 200 for a valid invitation', function(done) {
      var self = this;

      self.core.pubsub.local.topic('invitation:init:success').subscribe(function(invitation) {
        request(self.app)
          .get('/api/invitations/' + invitation.uuid)
          .expect(200)
          .end(done);
      });


      this.app = this.helpers.requireBackend('webserver/application');
      var app = this.app;
      var admUser = this.models.users[0],
          email = admUser.emails[0],
          password = 'secret';
      this.helpers.api.loginAsUser(this.app, email, password, function(err, loginAsUser0) {
        if (err) { return done(err); }
        var req = loginAsUser0(request(app).post('/api/domains/' + self.models.domain._id + '/invitations'));
        req.send(['foo@bar.com']);
        req.expect(202);
        req.end(function() {});
      });

    });


    it('should return 404 for a too old invitation', function(done) {
      var self = this;

      self.core.pubsub.local.topic('invitation:init:success').subscribe(function(invitation) {
        var d = new Date();
        d.setFullYear(2000, 0, 1);
        invitation.timestamps.created = d;
        invitation.save(function(err, invitation) {
          if (err) {
            return done(err);
          }
          request(self.app)
            .get('/api/invitation/' + invitation.uuid)
            .expect(404)
            .end(done);
        });
      });



      this.app = this.helpers.requireBackend('webserver/application');
      var app = this.app;
      var admUser = this.models.users[0],
          email = admUser.emails[0],
          password = 'secret';
      this.helpers.api.loginAsUser(this.app, email, password, function(err, loginAsUser0) {
        if (err) { return done(err); }
        var req = loginAsUser0(request(app).post('/api/domains/' + self.models.domain._id + '/invitations'));
        req.send(['foo@bar.com']);
        req.expect(202);
        req.end(function() {});
      });

    });

  });
});
