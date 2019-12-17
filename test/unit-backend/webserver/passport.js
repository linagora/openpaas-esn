const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');

describe('The passport configuration module', function() {
  let application;

  beforeEach(function(done) {
    application = {
      use: sinon.spy()
    };
    this.testEnv.initCore(done);
  });

  it('should not fail with default configuration settings (file)', function(done) {
    this.helpers.requireBackend('webserver/passport')(application);
    var passport = require('passport');
    expect(passport._strategy('local')).to.exist;
    done();
  });

  describe('Invalid configuration', function() {

    it('should not fail when auth module is defined but does not exists', function() {
      var conf = {
        log: {
          file: {
            enabled: false
          },
          console: {
            enabled: false
          }
        },
        auth: {
          strategies: ['foobar']
        }
      };
      var configMock = {
        config: function() {
          return conf;
        }
      };
      mockery.registerMock('../core', configMock);
      this.helpers.requireBackend('webserver/passport')(application);
      var passport = require('passport');
      expect(passport._strategy('foobar')).to.be.undefined;
    });

  });

  describe('The serialize fn', function() {
    var passport;

    beforeEach(function() {
      this.helpers.requireBackend('webserver/passport')(application);
      passport = require('passport');
    });

    it('should serialize ESN user', function(done) {
      var mail = 'foo@bar.com';
      var user = {
        emails: [mail]
      };
      passport.serializeUser(user, function(err, serialized) {
        expect(err).to.not.exist;
        expect(serialized).to.equal(mail);
        done();
      });
    });

    it('should serialize a passport user', function(done) {
      var mail = 'foo@bar.com';
      var user = {
        emails: [{type: 'home', value: mail}]
      };
      passport.serializeUser(user, function(err, serialized) {
        expect(err).to.not.exist;
        expect(serialized).to.equal(mail);
        done();
      });
    });

    it('should fail when no email is set', function(done) {
      var user = {};
      passport.serializeUser(user, function(err, serialized) {
        expect(err).to.exist;
        expect(serialized).to.not.exist;
        done();
      });
    });
  });
});
