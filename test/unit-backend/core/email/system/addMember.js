'use strict';

var expect = require('chai').expect;

describe('The add member email module', function() {

  beforeEach(function(done) {
    this.testEnv.writeDBConfigFile();
    var conf = require(this.testEnv.basePath + '/backend/core')['esn-config']('mail');
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
    this.testEnv.initCore();
    conf.store(mail, function(err) {
      done(err);
    });
  });

  afterEach(function(done) {
    var conf = require(this.testEnv.basePath + '/backend/core')['esn-config']('mail');
    conf.store({}, done);
    this.testEnv.removeDBConfigFile();
  });

  it('should send an email with valid data', function(done) {
    var tmp = this.testEnv.tmp;
    var path = require('path');
    var fs = require('fs');

    var invitation = {
      data: {
        firstname: 'Foo',
        lastname: 'Bar',
        email: 'to@bar.com',
        domain: 'FoobarBaz',
        url: 'http://localhost:8080/invitation/123456789'
      }
    };

    var confirmation = require(this.testEnv.basePath + '/backend/core/email/system/addMember');
    confirmation(invitation, function(err, response) {
      expect(err).to.not.exist;
      var file = path.resolve(tmp + '/' + response.messageId + '.eml');
      expect(fs.existsSync(file)).to.be.true;
      var MailParser = require('mailparser').MailParser;
      var mailparser = new MailParser();
      mailparser.on('end', function(mail_object) {
        expect(mail_object.html).to.be.not.null;
        expect(mail_object.html).to.contain(invitation.data.firstname);
        expect(mail_object.html).to.contain(invitation.data.lastname);
        expect(mail_object.html).to.contain(invitation.data.domain);
        expect(mail_object.html).to.contain(invitation.data.url);
        expect(mail_object.to).to.exist;
        expect(mail_object.to[0]).to.exist;
        expect(mail_object.to[0].address).to.equal(invitation.data.email);
        done();
      });
      fs.createReadStream(file).pipe(mailparser);
    });
  });
});
