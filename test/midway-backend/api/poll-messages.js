'use strict';
var request = require('supertest');
var expect = require('chai').expect;

describe('The messages API', function() {
  var app;

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      app = self.helpers.requireBackend('webserver/application');
      self.mongoose = require('mongoose');
      self.PollMessage = self.helpers.requireBackend('core/db/mongo/models/pollmessage');

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        self.models = models;
        done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('poll messages', function() {
    describe('POST /api/messages', function() {
      it('should allow posting poll messages', function(done) {
        var target = {
          objectType: 'activitystream',
          id: this.models.communities[0].activity_stream.uuid
        };
        this.helpers.api.loginAsUser(app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(app).post('/api/messages'));
          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'one'}, {label: 'two'}]
              }
            },
            targets: [target]
          }).expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body._id).to.exist;
            done();
          });
        });
      });
      it('should not allow posting poll messages without description', function(done) {
        var target = {
          objectType: 'activitystream',
          id: this.models.communities[0].activity_stream.uuid
        };
        this.helpers.api.loginAsUser(app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(app).post('/api/messages'));
          req.send({
            object: {
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'one'}, {label: 'two'}]
              }
            },
            targets: [target]
          }).expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
      it('should not allow posting poll messages without pollChoices property', function(done) {
        var target = {
          objectType: 'activitystream',
          id: this.models.communities[0].activity_stream.uuid
        };
        this.helpers.api.loginAsUser(app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(app).post('/api/messages'));
          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {}
            },
            targets: [target]
          }).expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
      it('should not allow posting poll messages with an empty pollChoices property', function(done) {
        var target = {
          objectType: 'activitystream',
          id: this.models.communities[0].activity_stream.uuid
        };
        this.helpers.api.loginAsUser(app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(app).post('/api/messages'));
          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: []
              }
            },
            targets: [target]
          }).expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
      it('should not allow posting poll messages with a pollChoices of invalid choices', function(done) {
        var target = {
          objectType: 'activitystream',
          id: this.models.communities[0].activity_stream.uuid
        };
        this.helpers.api.loginAsUser(app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(app).post('/api/messages'));
          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'three'}, {one: 'one'}, {two: 'two'}]
              }
            },
            targets: [target]
          }).expect(500).end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
      it('should not allow posting poll messages with less than two choices', function(done) {
        var target = {
          objectType: 'activitystream',
          id: this.models.communities[0].activity_stream.uuid
        };
        this.helpers.api.loginAsUser(app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(app).post('/api/messages'));
          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'three'}]
              }
            },
            targets: [target]
          }).expect(500)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body.error.details).to.contain('Validation');
            done();
          });
        });
      });
    });
    describe('PUT /api/messages/:id/vote/:vote', function() {
      beforeEach(function(done) {
        var self = this;
        var target = {
          objectType: 'activitystream',
          id: this.models.communities[2].activity_stream.uuid
        };
        this.helpers.api.loginAsUser(app, this.models.users[0].emails[0], 'secret', function(err, loggedInAsUser) {
          if (err) {
            return done(err);
          }
          var req = loggedInAsUser(request(app).post('/api/messages'));
          req.send({
            object: {
              description: 'poll1',
              objectType: 'poll',
              data: {
                pollChoices: [{label: 'one'}, {label: 'two'}, {label: 'three'}]
              }
            },
            targets: [target]
          }).expect(201)
          .end(function(err, res) {
            self.messageId = res.body._id;
            done();
          });
        });
      });

      describe('when user does not have read right on the message', function() {
        beforeEach(function(done) {
          var self = this;
          this.helpers.api.loginAsUser(app, this.models.users[3].emails[0], 'secret', function(err, loggedInAsUser) {
            self.loggedInAsUser = loggedInAsUser;
            done();
          });
        });
        it('should not be able to vote', function(done) {
          var req = this.loggedInAsUser(request(app).put('/api/messages/' + this.messageId + '/vote/0'));
          req.send({})
          .expect(403)
          .end(done);
        });
      });
      describe('when user have read right on the message', function() {
        beforeEach(function(done) {
          var self = this;
          this.helpers.api.loginAsUser(app, this.models.users[1].emails[0], 'secret', function(err, loggedInAsUser) {
            self.loggedInAsUser = loggedInAsUser;
            done();
          });
        });
        it('should be able to vote', function(done) {
          var req = this.loggedInAsUser(request(app).put('/api/messages/' + this.messageId + '/vote/0'));
          req.send({});
          req.expect(200)
          .end(done);
        });
        it('should not be able to vote twice on the same choice', function(done) {
          var liau = this.loggedInAsUser;
          var messageId = this.messageId;
          var req = liau(request(app).put('/api/messages/' + messageId + '/vote/0'));
          req.send({})
          .expect(200)
          .end(function() {
            var req2 = liau(request(app).put('/api/messages/' + messageId + '/vote/0'));
            req2.send({})
            .expect(403)
            .end(function(err, res) {
              done();
            });
          });
        });
        it('should not be able to vote once again, but on another choice', function(done) {
          var liau = this.loggedInAsUser;
          var messageId = this.messageId;
          var req = liau(request(app).put('/api/messages/' + messageId + '/vote/0'));
          req.send({})
          .expect(200)
          .end(function() {
            var req2 = liau(request(app).put('/api/messages/' + messageId + '/vote/1'));
            req2.send({})
            .expect(403)
            .end(function(err, res) {
              done();
            });
          });
        });
      });
    });
  });
});
