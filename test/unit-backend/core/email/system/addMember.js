'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The add member email module', function() {

  var confirmation;
  var i18nMock, emailMock;

  beforeEach(function() {
    i18nMock = {
      __: function() {
        return '';
      }
    };

    emailMock = {
      getMailer: function() {
        return {
          sendHTML: function() {}
        };
      }
    };

    mockery.registerMock('../../../i18n', i18nMock);
    mockery.registerMock('../index', emailMock);

    confirmation = this.helpers.requireBackend('core/email/system/addMember');
  });

  it('should fail when invitation is not set', function(done) {
    confirmation(null, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should fail when invitation data is not set', function(done) {
    confirmation({}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send an email when invitation data is set', function(done) {
    emailMock.getMailer = function() {
      return {
        sendHTML: function(message, template, locals, done) {
          return done(null, {sent: true});
        }
      };
    };

    var invitation = {
      data: {
        firstname: 'Foo',
        lastname: 'Bar',
        email: 'to@bar.com',
        domain: { _id: 'domain_id' },
        url: 'http://localhost:8080/invitation/123456789'
      }
    };

    confirmation(invitation, function(err, response) {
      expect(err).to.not.exist;
      expect(response).to.exist;
      expect(response.sent).to.be.true;
      done();
    });
  });
});
