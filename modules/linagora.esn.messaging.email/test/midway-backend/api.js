'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('linagora.esn.messaging.email module', function() {
  var moduleName = 'linagora.esn.messaging.email';

  var createToken = function(message, user, callback) {
    var EmailRecipientToken = require('mongoose').model('EmailRecipientToken');
    new EmailRecipientToken({
      user: user,
      message: {
        id: message._id,
        objectType: message.objectType
      }
    }).save(callback);
  };

  beforeEach(function(done) {
    var self = this;
    this.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }

      self.helpers.api.applyDomainDeployment(
        'linagora_EMAILReply',
        {
          fixtures: __dirname + '/../fixtures/deployments'
        },
        function(err, models) {
          if (err) {
            return done(err);
          }
          self.models = models;
          return done();
        }
      );
    });
  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(this.models, done);
  });

  describe('POST /api/messages/email/reply', function() {
    beforeEach(function() {
      var app = require('../../backend/webserver/application')(this.helpers.modules.current.lib, this.helpers.modules.current.deps);
      this.app = this.helpers.modules.getWebServer(app);
    });

    it('should send back 404 if x-esn-email-to-reply-from is not a registered user', function(done) {
      var req = request(this.app).post('/api/messages/email/reply');
      req.set('x-esn-email-to-reply-to', 'to@bar.com');
      req.set('x-esn-email-to-reply-from', 'from@bar.com');
      req.set('Content-Type', 'message/rfc822');
      req.send('123');
      req.expect(404);
      req.end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
    });

    it('should send back 403 if the user can not reply to the message', function(done) {
      var self = this;

      this.helpers.api.createMessage('whatsup', 'This is the message content', self.models.users[1], [self.models.communities[0].activity_stream.uuid], function(err, message) {
        if (err) {
          return done(err);
        }

        createToken(message, self.models.users[2], function(err, emailtoken) {
          if (err) {
            return done(err);
          }

          if (!emailtoken) {
            return done(new Error());
          }

          var req = request(self.app).post('/api/messages/email/reply');
          req.set('Content-Type', 'message/rfc822');
          req.set('x-esn-email-to-reply-to', emailtoken.token + '@open-paas.org');
          req.set('x-esn-email-to-reply-from', self.models.users[2].emails[0]);
          req.send('123');
          req.expect(403);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
        });
      });
    });

    it('should send back 201 when reply is ok', function(done) {
      var self = this;

      this.helpers.api.createMessage('whatsup', 'This is the message content', self.models.users[1], [self.models.communities[0].activity_stream.uuid], function(err, message) {
        if (err) {
          return done(err);
        }

        createToken(message, self.models.users[1], function(err, emailtoken) {
          if (err) {
            return done(err);
          }

          if (!emailtoken) {
            return done(new Error());
          }

          var fs = require('fs');
          var file = __dirname + '/../fixtures/mail.eml';
          var email = fs.readFileSync(file, 'utf8');

          var req = request(self.app).post('/api/messages/email/reply');
          req.set('Content-Type', 'message/rfc822');
          req.set('x-esn-email-to-reply-to', emailtoken.token + '@open-paas.org');
          req.set('x-esn-email-to-reply-from', self.models.users[1].emails[0]);
          req.send(email);
          req.expect(201);
          req.end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body.parentId).to.exist;
            expect(res.body.parentId).to.equal(message._id + '');
            done();
          });
        });
      });
    });
  });
});
