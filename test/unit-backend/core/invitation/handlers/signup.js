'use strict';

var expect = require('chai').expect;

describe('The signup handler', function() {

  describe('The validate fn', function() {

    it('should fail if invitation data is not set', function(done) {
      var signup = require('../../../../../backend/core/invitation/handlers/signup');
      signup.validate({}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should fail if email is not set', function(done) {
      var signup = require('../../../../../backend/core/invitation/handlers/signup');
      signup.validate({data: {foo: 'bar'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should fail if firstname is not set', function(done) {
      var signup = require('../../../../../backend/core/invitation/handlers/signup');
      signup.validate({data: {foo: 'bar'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should fail if lastname is not set', function(done) {
      var signup = require('../../../../../backend/core/invitation/handlers/signup');
      signup.validate({data: {foo: 'bar'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });

    it('should be ok if required data is set', function(done) {
      var signup = require('../../../../../backend/core/invitation/handlers/signup');
      signup.validate({data: {firstname: 'foo', lastname: 'bar', email: 'baz@me.org'}}, function(err, result) {
        expect(result).to.be.true;
        done();
      });
    });

    it('should fail is email is not an email', function(done) {
      var signup = require('../../../../../backend/core/invitation/handlers/signup');
      signup.validate({data: {firstname: 'foo', lastname: 'bar', email: 'baz'}}, function(err, result) {
        expect(result).to.be.false;
        done();
      });
    });
  });

  describe('The init fn', function() {
    before(function(done) {
      this.testEnv.writeDBConfigFile();
      var conf = require('../../../../../backend/core/esn-config')('mail');
      var mail = {
        mail: {
          noreply: 'no-reply@hiveety.org'
        },
        transport: {
          type: 'Pickup',
          config: {
            directory: this.testEnv.tmp
          }
        }
      };

      conf.store(mail, function(err) {
        done(err);
      });
    });

    after(function() {
      this.testEnv.removeDBConfigFile();
    });

    it('should fail if invitation uuid is not set', function(done) {
      var signup = require('../../../../../backend/core/invitation/handlers/signup');
      signup.init({}, function(err, result) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send an invitation email if all data is valid', function(done) {
      var tmp = this.testEnv.tmp;

      var invitation = {
        uuid: '123456789',
        data: {
          firstname: 'Foo',
          lastname: 'Bar',
          email: 'foo@bar.com'
        }
      };

      var path = require('path');
      var fs = require('fs');
      var signup = require('../../../../../backend/core/invitation/handlers/signup');
      signup.init(invitation, function(err, response) {
        expect(err).to.not.exist;
        var file = path.resolve(tmp + '/' + response.messageId + '.eml');
        expect(fs.existsSync(file)).to.be.true;
        var MailParser = require('mailparser').MailParser;
        var mailparser = new MailParser();
        mailparser.on('end', function(mail_object) {
          expect(mail_object.html).to.be.not.null;
          console.log(mail_object.html);
          expect(mail_object.html).to.have.string(invitation.data.firstname);
          expect(mail_object.html).to.have.string(invitation.data.lastname);
          expect(mail_object.html).to.have.string(invitation.uuid);
          done();
        });
        fs.createReadStream(file).pipe(mailparser);
      });
    });
  });
});
