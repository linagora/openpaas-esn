'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var fs = require('fs-extra');
var async = require('async');
var _ = require('lodash');
var path = require('path');

describe('The password API', function() {
  var User, PasswordReset, jwt, webserver, user, fixtures, esnConfig;

  function getLastFileFrom(dir) {
    var emails = fs.readdirSync(dir).filter(function(file) {
      return new RegExp('.*\\.eml').test(file) === true;
    });

    return _.max(emails, function(email) {
      var fullpath = path.join(dir, email);

      return fs.statSync(fullpath).ctime;
    });
  }

  beforeEach(function(done) {
    var self = this;

    this.mongoose = require('mongoose');
    this.testEnv.initCore(function() {
      User = self.helpers.requireBackend('core/db/mongo/models/user');
      PasswordReset = self.helpers.requireBackend('core/db/mongo/models/passwordreset');
      webserver = self.helpers.requireBackend('webserver').webserver;
      jwt = self.helpers.requireBackend('core/auth/jwt');
      fixtures = self.helpers.requireFixture('models/users.js')(User);
      esnConfig = self.helpers.requireBackend('core/esn-config');
      user = fixtures.newDummyUser(['johndoe@open-paas.org'], 'secret');
      user.save(function(err) {
        if (err) { return done(err); }

        async.series([
          function(callback) {
            esnConfig('jwt').store({
              algorithm: 'RS256',
              publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtlChO/nlVP27MpdkG0Bh\n16XrMRf6M4NeyGa7j5+1UKm42IKUf3lM28oe82MqIIRyvskPc11NuzSor8HmvH8H\nlhDs5DyJtx2qp35AT0zCqfwlaDnlDc/QDlZv1CoRZGpQk1Inyh6SbZwYpxxwh0fi\n+d/4RpE3LBVo8wgOaXPylOlHxsDizfkL8QwXItyakBfMO6jWQRrj7/9WDhGf4Hi+\nGQur1tPGZDl9mvCoRHjFrD5M/yypIPlfMGWFVEvV5jClNMLAQ9bYFuOc7H1fEWw6\nU1LZUUbJW9/CH45YXz82CYqkrfbnQxqRb2iVbVjs/sHopHd1NTiCfUtwvcYJiBVj\nkwIDAQAB\n-----END PUBLIC KEY-----',
              privateKey: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAtlChO/nlVP27MpdkG0Bh16XrMRf6M4NeyGa7j5+1UKm42IKU\nf3lM28oe82MqIIRyvskPc11NuzSor8HmvH8HlhDs5DyJtx2qp35AT0zCqfwlaDnl\nDc/QDlZv1CoRZGpQk1Inyh6SbZwYpxxwh0fi+d/4RpE3LBVo8wgOaXPylOlHxsDi\nzfkL8QwXItyakBfMO6jWQRrj7/9WDhGf4Hi+GQur1tPGZDl9mvCoRHjFrD5M/yyp\nIPlfMGWFVEvV5jClNMLAQ9bYFuOc7H1fEWw6U1LZUUbJW9/CH45YXz82CYqkrfbn\nQxqRb2iVbVjs/sHopHd1NTiCfUtwvcYJiBVjkwIDAQABAoIBAAkhTJHGV/fDpSZJ\ncpfyx3OXOYoB22PNBmgezPHKW7goZ7tf/rPLjU/MdXRW2Ps75ssrInzyhTwEzRXQ\nLg/uhKC9RD/B0Fu9PpiYt/vAqlb865qmm5PvfknZhkwntytCL7rQ+HEkysx2br2f\nrPr5XKKK1tIh35NzlwfktWQOjG1sk5vfHc/fyUrWE6KoZgIrW0Rmc8c7YRMwljYT\nUGQAL2LBDGsocFV92AsMCLcCmI/gF0J2g5880htcj+TzsdCHAPviB8Z262mFlmLB\nrPWlUwWLmqdyr9YoLXszZ+iERCglPK8kn14wxcrNWrxLlHU9b2HXRIR9MwlyjLDK\nLc8lgHECgYEA6C3nJfGqmj2Y7fLxZOcTwuP5UvprwbvHaoeU8brPjrt+Wp4MgznG\nIJLtd7twJQhMh4NPQSqZhQxDb+Pa8S5prLH2lvEa9+sNXeh/z5FD0NG1zsNGJ+Am\nB+7xM5LlpinDh+NlCLHiWOg/YcQtqfIvNFwDdt9LGE37dxOpSF9jxIcCgYEAyQUP\nRXECEWYfMd2z7spzJ3hP3o/qPA5WE0EaXMRtLAQg9cnLM7odcT37uFT7joHijPe/\nml7cjJf9oyCZjN8GqGmaHH4MYe5LQVQrwmkMH6Y5pvFta5i9p9SA0h98TEr/rThL\nKRKwz+ItSz6YP7WINBsBdbJNjJxj7su9s8udN5UCgYAdARb+I3l3eThwiUfkngVW\n9FnCJuxtMEMSKMvPgtHI990p/tJ7Vi1NBm3J5k11IttEln/BGUxCVaza/nDsbirf\nWv/+DTKcQ+3QjGnjCTeaj4gRw00xUAwQM6ZIFhLANjlp8Vs+wdIP3zuDwBkgQNPq\ny4/XOr/L0noWfwtHsjrpYwKBgQC8RnblLVEohqOVCvdqIkf0oeT8qYJTuYG5CvLs\nDDXMUhmk29nsmtbUp59KKJ5r/Q75xVm59jtPm1O+I9xtar5LoozrPsvONWhaycEq\nl0T5p7C7wcggTLDlrkzxgPfkZSJPVThgQddE/aw6m2fx0868LscRO20S069ti3ok\nGgMoeQKBgQCnKB+IPX+tnUqkGeaLuZbIHBIAMxgkbv6s6R/Ue7wbGt/tcRXhrc4x\nQDSXlF8GxlJW0Lnmorz/ZRm6ajf1EpajEBh97cj4bnwWFiKe+Vsivkp72wPb9qSl\ninNz0WXJtOTrDLhu55P0mDjArCCYNi69WTq9jTo18v4DI0zzfUUaaQ==\n-----END RSA PRIVATE KEY-----'
            }, callback);
          },
          callback => esnConfig('login').store({
              resetpassword: true
            }, callback),
          function(callback) {
            self.helpers.mail.saveConfiguration({
              mail: { noreply: 'noreply@linagora.com' },
              transport: {
                module: 'nodemailer-pickup-transport',
                config: {directory: self.testEnv.tmp}
              }
            }, callback);
          }
        ], done);
      });
    });
  });

  afterEach(function(done) {
    this.helpers.mongo.dropDatabase(done);
  });

  describe('POST /api/passwordreset', function() {
    it('should return 403 if reset password is disabled by configuration', function(done) {
      esnConfig('login').store({ resetpassword: false }, err => {
        if (err) {
          return done(err);
        }

        return request(webserver.application)
          .post('/api/passwordreset')
          .set('Content-Type', 'application/json')
          .expect(403)
          .end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body.error.details).to.equal('password reset feature is currently disabled');

            done();
          });
      });
    });

    it('should return 400 if req.body.email is undefined', function(done) {
      request(webserver.application)
        .post('/api/passwordreset')
        .set('Content-Type', 'application/json')
        .expect(400)
        .end(done);
    });

    it('should return 404 if no user is found', function(done) {
      request(webserver.application)
        .post('/api/passwordreset')
        .set('Content-Type', 'application/json')
        .send({email: 'janedoe@open-paas.org'})
        .expect(404)
        .end(done);
    });

    it.skip('should return 200 if the email is correctly sent with correct context and a PasswordReset has been created', function(done) {
      var self = this;

      request(webserver.application)
        .post('/api/passwordreset')
        .set('Content-Type', 'application/json')
        .send({email: 'johndoe@open-paas.org'})
        .expect(200)
        .end(function(err) {
          expect(err).to.not.exist;
          async.parallel([
            function(callback) {
              PasswordReset.findOne({email: 'johndoe@open-paas.org'}, function(err, result) {
                callback((err || !result) ? new Error('An error occured ' + err.message) : null);
              });
            },
            function(callback) {
              var email = getLastFileFrom(self.testEnv.tmp);
              var emailContent = fs.readFileSync(path.join(self.testEnv.tmp, email), 'utf8');

              expect(emailContent).to.have.string('To: johndoe@open-paas.org');
              expect(emailContent).to.have.string('foo bar');
              expect(emailContent).to.have.string('http://localhost:8081/passwordres=\r\net?jwt=');
              callback(null);
            }
          ], done);
        });
    });
  });

  describe('PUT /api/passwordreset', function() {
    it('should return 403 if reset password is disabled by configuration', function(done) {
      esnConfig('login').store({ resetpassword: false }, err => {
        if (err) {
          return done(err);
        }

        return request(webserver.application)
          .post('/api/passwordreset')
          .set('Content-Type', 'application/json')
          .expect(403)
          .end((err, res) => {
            expect(err).to.not.exist;
            expect(res.body.error.details).to.equal('password reset feature is currently disabled');

            done();
          });
      });
    });

    it('should return 401 if no jwt token is provided', function(done) {
      request(webserver.application)
        .put('/api/passwordreset')
        .expect(401)
        .end(done);
    });

    it('should return 400 if the jwt token payload is wrong', function(done) {
      jwt.generateWebToken({foo: 'bar'}, function(err, jwtToken) {
        if (err) { return done(err); }
        request(webserver.application)
          .put('/api/passwordreset')
          .query({jwt: jwtToken})
          .expect(400)
          .end(done);
      });
    });

    it('should return 404 if no user is found', function(done) {
      jwt.generateWebToken({email: 'janedoe@open-paas.org'}, function(err, jwtToken) {
        if (err) { return done(err); }
        request(webserver.application)
          .put('/api/passwordreset')
          .query({jwt: jwtToken})
          .expect(404)
          .end(done);
      });
    });

    it('should return 400 if no new password are provided', function(done) {
      jwt.generateWebToken({email: 'johndoe@open-paas.org'}, function(err, jwtToken) {
        if (err) { return done(err); }
        request(webserver.application)
          .put('/api/passwordreset')
          .query({jwt: jwtToken})
          .expect(400)
          .end(done);
      });
    });

    it('should return 200, the user has now a new password and PasswordReset is removed', function(done) {
      var self = this;

      jwt.generateWebToken({email: 'johndoe@open-paas.org'}, function(err, jwtToken) {
        if (err) { return done(err); }
        request(webserver.application)
          .put('/api/passwordreset')
          .query({jwt: jwtToken})
          .send({password: 'newpassword'})
          .expect(200)
          .end(function(err) {
            expect(err).to.not.exist;
            async.parallel([
              function(callback) {
                PasswordReset.findOne({email: 'johndoe@open-paas.org'}, function(err, result) {
                  callback((err || result) ? new Error('An error occured ' + err.message) : null);
                });
              },
              function(callback) {
                self.helpers.api.loginAsUser(webserver.application, 'johndoe@open-paas.org', 'newpassword', callback);
              }
            ], done);
          });
      });
    });
  });

  describe('PUT /api/passwordreset/changepassword', function() {
    it('should return 401 if no login token is provided', function(done) {
      request(webserver.application)
        .put('/api/passwordreset/changepassword')
        .expect(401)
        .end(done);
    });

    it('should return 400 if oldpassword is missing', function(done) {
      this.helpers.api.loginAsUser(webserver.application, 'johndoe@open-paas.org', 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).put('/api/passwordreset/changepassword'));

        req.send({newpassword: 'secret'})
           .expect(400)
           .end(done);
      });
    });

    it('should return 400 if newpassword is missing', function(done) {
      this.helpers.api.loginAsUser(webserver.application, 'johndoe@open-paas.org', 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).put('/api/passwordreset/changepassword'));

        req.send({oldpassword: 'secret'})
           .expect(400)
           .end(done);
      });
    });

    it('should return 400 if oldpassword is wrong', function(done) {
      this.helpers.api.loginAsUser(webserver.application, 'johndoe@open-paas.org', 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).put('/api/passwordreset/changepassword'));

        req.send({oldpassword: 'secret2', newpassword: 'newsecret'})
           .expect(400)
           .end(done);
      });
    });

    it('should return 200, the user has now a new password and PasswordReset is removed', function(done) {
      this.helpers.api.loginAsUser(webserver.application, 'johndoe@open-paas.org', 'secret', function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).put('/api/passwordreset/changepassword'));

        req.send({oldpassword: 'secret', newpassword: 'newsecret'})
           .expect(200)
           .end(done);
      });
    });
  });

  describe('GET /api/passwordreset', function() {
    it('should return 401 if no jwt token are provided', function(done) {
      request(webserver.application)
        .get('/passwordreset')
        .expect(401)
        .end(done);
    });

    it('should return 200 otherwise', function(done) {
      jwt.generateWebToken({email: 'johndoe@open-paas.org'}, function(err, jwtToken) {
        if (err) { return done(err); }
        request(webserver.application)
          .get('/passwordreset')
          .query({jwt: jwtToken})
          .expect(200)
          .end(done);
      });
    });
  });
});
