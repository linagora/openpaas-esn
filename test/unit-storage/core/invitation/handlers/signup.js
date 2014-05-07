'use strict';

var expect = require('chai').expect,
    mongodb = require('mongodb'),
    mockery = require('mockery');

describe.skip('The signup handler', function() {
  var mockModels, mockPubSub, mockEsnConfig;

  beforeEach(function() {
    mockModels = this.helpers.mock.models;
    mockPubSub = this.helpers.mock.pubsub;
    mockEsnConfig = this.helpers.mock.esnConfig;
  });

  describe('The validate fn', function() {

    beforeEach(function() {
      this.testEnv.initCore();
    });

    it('should fail if invitation data is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.validate({}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should fail if email is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.validate({data: {foo: 'bar'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should fail if firstname is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.validate({data: {foo: 'bar'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should fail if lastname is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.validate({data: {foo: 'bar'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should be ok if required data is set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.validate({data: {firstname: 'foo', lastname: 'bar', email: 'baz@me.org'}}, function(err, result) {
        expect(result).to.be.true;
        done();
      });
    });

    it('should fail is email is not an email', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.validate({data: {firstname: 'foo', lastname: 'bar', email: 'baz'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });
  });

  describe('The init fn', function() {

    beforeEach(function() {
      this.testEnv.initCore();
    });

    it('should fail if invitation uuid is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.init({}, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should fail if invitation.data.url is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.init({uuid: 123, data: {}}, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send an invitation email if all data is valid', function(done) {
      var invitation = {
        uuid: '123456789',
        data: {
          firstname: 'Foo',
          lastname: 'Bar',
          email: 'foo@bar.com',
          url: 'http://localhost:8080/invitation/123456789'
        }
      };
      var called = false;
      var signupEmailMocked = function(invitation, callback) {
        called = true;
        callback();
      }
      mockery.registerMock('../../email/system/signupConfirmation', signupEmailMocked);

      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.init(invitation, function(err, response) {
        expect(called).to.be.true;
        done();
      });
    });
  });

  describe('The process fn', function() {

    beforeEach(function() {
      this.testEnv.initCore();
    });

    it('should redirect to the invitation app if invitation is found', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');

      var invitation = {
        uuid: 12345678
      };

      signup.process(invitation, {}, function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.redirect).to.exist;
        done();
      });
    });

    it('should send back error if invitation is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.process(null, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('The finalize fn', function() {

    var User;
    var Domain;
    var Invitation;

    before(function(done) {
      this.testEnv.writeDBConfigFile();
      done();
    });

    after(function() {
      this.testEnv.removeDBConfigFile();
    });

    beforeEach(function(done) {

      var template = require(this.testEnv.basePath + '/backend/core/templates');
      template.user.store(done);
    });

    afterEach(function(done) {
      this.mongoose.connection.db.dropDatabase();
      this.mongoose.disconnect(done);
    });

    it('should send back error if invitation is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.finalize(null, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error if data is not set', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      signup.finalize({}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when domain / company exist', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      var emails = [];

      emails.push('toto@foo.com');
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      u.save(function(err, savedUser) {
        if (err) {
          return done(err);
        }

        var dom = {
          name: 'ESN',
          company_name: 'Linagora',
          administrator: savedUser
        };

        var i = new Domain(dom);
        i.save(function(err, saved) {
          if (err) {
            return done(err);
          }

          var invitation = {
            data: {
              email: 'foo@bar.com'
            }
          };
          var data = {
            body: {
              data: {
                firstname: 'foo',
                lastname: 'bar',
                password: 'secret',
                confirmpassword: 'secret',
                company: 'Linagora',
                domain: 'ESN'
              }
            }
          };

          signup.finalize(invitation, data, function(err) {
            expect(err).to.exist;
            done();
          });
        });
      });
    });

    it('should create a user if invitation and form data are set', function(done) {
      var mongoUrl = this.testEnv.mongoUrl;
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');
      var invitation = {
        type: 'test',
        data: {
          email: 'foo@bar.com'
        }
      };

      var invit = new Invitation(invitation);
      invit.save(function(err, saved) {
        if (err) {
          return done(err);
        }

        var data = {
          body: {
            data: {
              firstname: 'foo',
              lastname: 'bar',
              password: 'secret',
              confirmpassword: 'secret',
              company: 'Corporate',
              domain: 'ESN'
            }
          }
        };

        signup.finalize(saved, data, function(err, result) {
          expect(err).to.not.exist;
          expect(result).to.exist;
          expect(result.status).to.equal(201);

          mongodb.MongoClient.connect(mongoUrl, function(err, db) {
            if (err) {
              return done(err);
            }
            db.collection('users').findOne({_id: result.result.resources.user}, function(err, user) {
              if (err) {
                return done(err);
              }
              expect(user).to.exist;
              expect(user.domains).to.exist;
              expect(user.domains.length).to.equal(1);

              db.collection('domains').findOne({_id: result.result.resources.domain}, function(err, domain) {
                if (err) {
                  return done(err);
                }
                expect(domain).to.exist;
                expect(user.domains[0].domain_id).to.deep.equal(domain._id);
                db.close(function() {
                  done();
                });
              });
            });
          });
        });
      });
    });

    it('should send back error if invitation is already finalized', function(done) {
      var signup = require(this.testEnv.basePath + '/backend/core/invitation/handlers/signup');

      var invitation = {
        type: 'test',
        timestamps: {
          finalized: new Date()
        },
        data: {}
      };

      var data = {
        body: {
          data: {}
        }
      };

      var invit = new Invitation(invitation);
      invit.save(function(err, saved) {
        if (err) {
          return done(err);
        }

        signup.finalize(saved, data, function(err) {
          expect(err).to.exist;
          done();
        });
      });
    });
  });
});
