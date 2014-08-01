'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var fs = require('fs-extra');
var async = require('async');

describe('The email API', function() {

  var webserver;
  var User;
  var user;
  var password = 'secret';
  var email = 'foo@bar.com';
  var EMailMsg, Community, TimelineEntry;

  var saveCommunity = function(community, done) {
    var c = new Community(community);
    c.members = [{user: user._id}];
    return c.save(function(err, saved) {
      if (err) {
        return done(err);
      }
      community = saved;
      return done(null, saved);
    });
  };

  beforeEach(function(done) {
    var self = this;
    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      EMailMsg = require(self.testEnv.basePath + '/backend/core/db/mongo/models/emailmessage');
      Community = require(self.testEnv.basePath + '/backend/core/db/mongo/models/community');
      TimelineEntry = require(self.testEnv.basePath + '/backend/core/db/mongo/models/timelineentry');
      webserver = require(self.testEnv.basePath + '/backend/webserver');
      user = new User({password: password, emails: [email]});
      user.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        user._id = saved._id;
        return done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('POST /api/email', function() {

    it('should create email in messages from incoming eml', function(done) {
      var self = this;
      var community = {title: 'node.js'};
      async.series([
        function(callback) {
          saveCommunity(community, function(err, saved) {
            if (err) {
              return callback(err);
            }
            community = saved;
            return callback();
          });
        },
        function() {
          self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }

            var file = self.testEnv.fixtures + '/emails/simple.eml';
            var email = fs.readFileSync(file, 'utf8');
            var req = loggedInAsUser(request(webserver.application).post('/api/messages/email'));
            req.query({objectType: 'activitystream', id: community.activity_stream.uuid});
            req.set('Content-Type', 'message/rfc822');
            req.send(email);
            req.expect(201);
            req.end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              EMailMsg.find(function(err, result) {
                if (err) {
                  return done(err);
                }
                expect(result).to.exist;
                expect(result.length).to.equal(1);
                expect(result[0].objectType).to.equal('email');
                expect(result[0].shares).to.exist;
                expect(result[0].shares.length).to.equal(1);
                expect(result[0].shares[0].objectType).to.equal('activitystream');
                expect(result[0].shares[0].id).to.equal(community.activity_stream.uuid);

                expect(result[0].subject).to.equal('Chuck!');
                expect(result[0].content).to.equal('Google, c\'est le seul endroit où tu peux taper Chuck Norris...');
                expect(result[0].from).to.equal('from@open-paas.org');
                expect(result[0].to).to.exist;
                expect(result[0].to.length).to.equal(1);
                expect(result[0].to[0]).to.equal('to@open-paas.org');

                process.nextTick(function() {
                  TimelineEntry.find({}, function(err, results) {
                    expect(results).to.exist;
                    expect(results.length).to.equal(1);
                    expect(results[0].verb).to.equal('email');
                    expect(results[0].target).to.exist;
                    expect(results[0].target.length).to.equal(1);
                    expect(results[0].target[0].objectType).to.equal('activitystream');
                    expect(results[0].target[0]._id).to.equal(community.activity_stream.uuid);
                    expect(results[0].object).to.exist;
                    expect(results[0].object.objectType).to.equal('email');
                    expect(results[0].object._id + '').to.equal(res.body._id);
                    expect(results[0].actor).to.exist;
                    expect(results[0].actor.objectType).to.equal('user');
                    expect(results[0].actor._id + '').to.equal('' + user._id);
                    done();
                  });
                });
              });
            });
          });
        }],
        function(err) {
          done(err);
        }
      );
    });

    it('should send back 400 is stream is not found', function(done) {

      var self = this;
      async.series([
          function(callback) {
            saveCommunity({title: 'Node.js'}, callback);
          },
          function() {
            self.helpers.api.loginAsUser(webserver.application, email, password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }

              var file = self.testEnv.fixtures + '/emails/simple.eml';
              var email = fs.readFileSync(file, 'utf8');
              var req = loggedInAsUser(request(webserver.application).post('/api/messages/email'));
              req.query({objectType: 'activitystream', id: '123'});
              req.set('Content-Type', 'message/rfc822');
              req.send(email);
              req.expect(400);
              req.end(function(err, res) {
                expect(err).to.not.exist;
                done();
              });
            });
          }],
        function(err) {
          done(err);
        }
      );
    });
  });
});
