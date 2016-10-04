'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The signup confirmation email module', function() {

  it('should send an email with valid data', function(done) {
    var esnConfigMock = function() {
      return {
        get: function(callback) {
          callback();
        }
      };
    };

    var properties = {};

    var i18nMock = {
      __: function(subject) {
        properties.subject = subject;

        return '';
      }
    };

    var emailMock = {
      getMailer: function() {
        return {
          sendHTML: function(message, template, locals, callback) {
            properties.template = template;
            callback();
          }
        };
      }
    };

    mockery.registerMock('../../esn-config', esnConfigMock);
    mockery.registerMock('../../../i18n', i18nMock);
    mockery.registerMock('../index', emailMock);

    var invitation = {
      data: {
        firstname: 'Foo',
        lastname: 'Bar',
        email: 'to@bar.com',
        domain: 'FoobarBaz',
        url: 'http://localhost:8080/invitation/123456789'
      }
    };

    var confirmation = this.helpers.requireBackend('core/email/system/signupConfirmation');

    confirmation(invitation, function() {
      expect(properties).to.deep.equal({
        subject: 'Please activate your account',
        template: 'core.signup-email-confirmation'
      });
      done();
    });
  });
});
