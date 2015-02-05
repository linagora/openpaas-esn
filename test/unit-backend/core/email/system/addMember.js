'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The add member email module', function() {

  it('should fail when invitation is not set', function(done) {
    var coreMock = function() {
      return {
        get: function(callback) {
          return callback();
        }
      };
    };

    var i18nMock = {
      __: function() {
        return '';
      }
    };

    var emailMock = {
      sendHTML: function() {}
    };

    mockery.registerMock('../../../../core/esn-config', coreMock);
    mockery.registerMock('../../../i18n', i18nMock);
    mockery.registerMock('../index', emailMock);

    var confirmation = this.helpers.requireBackend('core/email/system/addMember');
    confirmation(null, function(err, response) {
      expect(err).to.exist;
      done();
    });
  });


  it('should fail when invitation data is not set', function(done) {
    var coreMock = function() {
      return {
        get: function(callback) {
          return callback();
        }
      };
    };

    var i18nMock = {
      __: function() {
        return '';
      }
    };

    var emailMock = {
      sendHTML: function() {}
    };

    mockery.registerMock('../../../../backend/core/esn-config', coreMock);
    mockery.registerMock('../../../i18n', i18nMock);
    mockery.registerMock('../index', emailMock);

    var confirmation = this.helpers.requireBackend('core/email/system/addMember');
    confirmation({}, function(err, response) {
      expect(err).to.exist;
      done();
    });
  });

  it('should fail if configuration fails', function(done) {
    var esnConfig = function() {
      return {
        get: function(callback) {
          return callback(new Error('Configuration fails'));
        }
      };
    };

    var i18nMock = {
      __: function() {
        return '';
      }
    };

    var emailMock = {
      sendHTML: function() {}
    };

    mockery.registerMock('../../../../backend/core/esn-config', esnConfig);
    mockery.registerMock('../../../i18n', i18nMock);
    mockery.registerMock('../index', emailMock);

    var invitation = {
      data: {
        email: 'foo@bar.com'
      }
    };

    var confirmation = this.helpers.requireBackend('core/email/system/addMember');
    confirmation(invitation, function(err, response) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send an email when invitation data is set', function(done) {
    var coreMock = function() {
      return {
        get: function(callback) {
          return callback(null, {foo: 'bar'});
        }
      };
    };

    var i18nMock = {
      __: function() {
        return '';
      }
    };

    var emailMock = {
      sendHTML: function(from, to, subject, template, invitation, done) {
        return done(null, {sent: true});
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

    var confirmation = this.helpers.requireBackend('core/email/system/addMember');
    confirmation(invitation, function(err, response) {
      expect(err).to.not.exist;
      expect(response).to.exist;
      expect(response.sent).to.be.true;
      done();
    });
  });
});
