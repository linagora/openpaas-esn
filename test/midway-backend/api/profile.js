'use strict';

var request = require('supertest'),
  fs = require('fs-extra'),
  expect = require('chai').expect;

describe('The profile API', function() {
  var app;
  var foouser, baruser;
  var password = 'secret';

  beforeEach(function(done) {
    fs.copySync(this.testEnv.fixtures + '/default.mongoAuth.json', this.testEnv.tmp + '/default.json');
    var self = this;
    this.testEnv.initCore(function() {
      app = require(self.testEnv.basePath + '/backend/webserver/application');
      self.mongoose = require('mongoose');
      var User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');

      foouser = new User({
        username: 'Foo',
        password: password,
        emails: ['foo@bar.com']
      });

      baruser = new User({
        username: 'Bar',
        password: password,
        emails: ['bar@bar.com']
      });

      function saveUser(user, cb) {
        user.save(function(err, saved) {
          if (saved) {
            user._id = saved._id;
          }
          return cb(err, saved);
        });
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          saveUser(baruser, callback);
        }
      ],
      function(err) {
        done(err);
      });
    });
  });

  afterEach(function(done) {
    fs.unlinkSync(this.testEnv.tmp + '/default.json');
    var User = this.mongoose.model('User');
    var Link = this.mongoose.model('Link');
    User.remove(function() {
      Link.remove(done);
    });
  });

  after(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('should not be able to get a profile without being authenticated', function(done) {
    request(app)
      .get('/api/profile/' + baruser._id)
      .expect(401)
      .end(done);
  });

  it('should create a profile link when authenticated user looks at a user profile', function(done) {
    var Link = this.mongoose.model('Link');
    request(app)
      .post('/api/login')
      .send({username: foouser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).get('/api/profile/' + baruser._id);
        req.cookies = cookies;
        req.expect(200)
          .end(function(err, res) {
            expect(err).to.not.exist;
            Link.find({user: foouser._id}, function(err, links) {
              expect(err).to.not.exist;
              expect(links).to.exist;
              expect(links.length).to.equal(1);
              expect(links[0].type).to.equal('profile');
              expect(links[0].target).to.exist;
              expect(links[0].target.resource).to.deep.equal(baruser._id);
              expect(links[0].target.type).to.equal('User');
              done();
            });
          });
      });
  });
});

