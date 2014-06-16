'use strict';

var expect = require('chai').expect,
  request = require('supertest'),
  uuid = require('node-uuid');

describe('The activitystreams routes', function() {

  before(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/timelineentry');
  });

  var webserver = null;
  var Domain, User, TimelineEntry;
  var activitystreamId, savedTimelineEntry;
  var password = 'secret';
  var email = 'foo@bar.com';

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    var self = this;
    this.testEnv.initCore(function() {
      webserver = require(self.testEnv.basePath + '/backend/webserver');

      Domain = self.mongoose.model('Domain');
      User = self.mongoose.model('User');
      TimelineEntry = self.mongoose.model('TimelineEntry');

      var user = new User({
        username: 'Foo',
        password: password,
        emails: [email]
      });
      var domainJSON = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: user
      };
      var domain = new Domain(domainJSON);

      user.save(function(err, u) {
        if (err) {
          done(err);
        }
        else {
          domain.save(function(err, d) {
            if (err) {
              done(err);
            }
            activitystreamId = d.activity_stream.uuid;
            var timelinentryJSON = {
              actor: {
                objectType: 'user',
                _id: u._id
              },
              object: {
                _id: u._id
              },
              target: [{objectType: 'activitystream', _id: activitystreamId}]
            };
            var timelineEntry = new TimelineEntry(timelinentryJSON);
            timelineEntry.save(function(err, saved) {
              if (err) {
                done(err);
              }
              savedTimelineEntry = saved;
              done();
            });
          });
        }
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('GET /api/activitystreams/:uuid', function(done) {

    it('should return a JSON with 404 result when activitystream does not exist', function(done) {
      var incorrectUUID = uuid.v4();
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/activitystreams/' + incorrectUUID);
          req.cookies = cookies;
          req.expect(404).end(function(err, res) {
            expect(err).to.be.null;
            done();
          });
        });
    });

    it('should return a JSON with 400 result when limit parameter is incorrect', function(done) {
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?limit=-12');
          req.cookies = cookies;
          req.expect(400).end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
        });
    });

    it('should return a JSON with 400 result when "before" parameter is incorrect', function(done) {
      var date = new Date();
      date.setDate(date.getDate() - 1);
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?before=pipo');
          req.cookies = cookies;
          req.expect(400).end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
        });
    });

    it('should return a JSON with 400 result when "after" parameter is incorrect', function(done) {
      var date = new Date();
      date.setDate(date.getDate() - 1);
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?after=pipo');
          req.cookies = cookies;
          req.expect(400).end(function(err, res) {
            expect(err).to.not.exist;
            done();
          });
        });
    });

    it('should return a JSON with 200 result when activitystream exists', function(done) {
      request(webserver.application)
        .post('/api/login')
        .send({username: email, password: password, rememberme: false})
        .expect(200)
        .end(function(err, res) {
          var cookies = res.headers['set-cookie'].pop().split(';')[0];
          var req = request(webserver.application).get('/api/activitystreams/' + activitystreamId + '?limit=10');
          req.cookies = cookies;
          req.expect(200).end(function(err, res) {
            expect(err).to.not.exist;

            var entryArray = res.body;
            expect(entryArray).to.be.not.null;
            expect(entryArray.length).to.equal(1);

            var entry = entryArray[0];
            expect(entry.actor).to.be.not.null;
            expect(entry.actor.objectType).to.equal('user');
            expect(entry.target).to.be.not.null;
            expect(entry.target.length).to.equal(1);
            expect(entry.target[0].objectType).to.equal('activitystream');
            expect(entry.target[0]._id).to.equal(activitystreamId);

            done();
          });
        });
    });

  });

});
