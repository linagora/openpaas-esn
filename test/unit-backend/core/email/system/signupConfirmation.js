'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The signup confirmation email module', function() {

  it('should send an email with valid data', function(done) {
    var coreMock = function() {
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
      sendHTML: function(from, to, subject, template, data, callback) {
        properties.template = template;
        callback();
      }
    };

    mockery.registerMock('../../../../backend/core/esn-config', coreMock);
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

    var confirmation = require(this.testEnv.basePath + '/backend/core/email/system/signupConfirmation');
    confirmation(invitation, function(err, response) {
      expect(properties).to.deep.equal({
        subject: 'Please activate your account',
        template: 'signup-email-confirmation'
      });
      done();
    });
  });
});
