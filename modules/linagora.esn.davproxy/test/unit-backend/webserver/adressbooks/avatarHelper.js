'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The avatarHelper module', function() {

  var deps, dependencies, bookId, bookName, cardId;

  beforeEach(function() {
    bookId = '123';
    bookName = '456';
    cardId = 'xyz';

    dependencies = {
      logger: {
        error: function() {},
        debug: function() {},
        warn: function() {}
      },
      'esn-config': function() {
        return {
          get: function(callback) {
            callback(null, null);
          }
        };
      },
      helpers: {
        config: {
          getBaseUrl: function(user, callback) {
            callback(null, 'http://localhost:8080');
          }
        }
      }
    };

    deps = function(name) {
      return dependencies[name];
    };
  });

  function getModule() {
    return require('../../../../backend/webserver/addressbooks/avatarHelper')(deps);
  }

  function getAvatarUrl() {
    return ['http://localhost:8080/contact/api/contacts', bookId, bookName, cardId, 'avatar'].join('/');
  }

  describe('The injectTextAvatar function', function() {
    var user;

    beforeEach(function() {
      user = {
        _id: '123',
        firstname: 'foo',
        lastname: 'bar'
      };
    });

    it('should inject text avatar url to vcard using DEFAULT_BASE_URL', function(done) {
      var vcardData = ['vcard', [
        ['version', {}, 'text', '4.0'],
        ['uid', {}, 'text', cardId]
      ]];

      getModule().injectTextAvatar(user, bookId, bookName, vcardData).then(function(output) {
        expect(output).to.eql(['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', cardId],
          ['photo', {}, 'uri', getAvatarUrl()]
        ]]);
        done();
      });
    });

    it('should have text avatar url based on base_url of web config', function(done) {
      var baseUrl = 'http://dev.open-paas.org';
      dependencies.helpers = {
        config: {
          getBaseUrl: function(user, callback) {
            callback(null, baseUrl);
          }
        }
      };
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', cardId]
        ]
      ];
      var avatarUrl = baseUrl + '/contact/api/contacts/' + bookId + '/' + bookName + '/' + cardId + '/avatar';

      getModule().injectTextAvatar(user, bookId, bookName, vcardData).then(function(output) {
        expect(output).to.eql(['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', cardId],
          ['photo', {}, 'uri', avatarUrl]
        ]]);
        done();
      });
    });

    it('should resolve original vcard when it has photo data already', function(done) {
      var vcardData = ['vcard', [
        ['version', {}, 'text', '4.0'],
        ['uid', {}, 'text', cardId],
        ['photo', {}, 'uri', 'some data here']
      ]];

      getModule().injectTextAvatar(user, bookId, bookName, vcardData).then(function(output) {
        expect(output).to.eql(vcardData);
        done();
      });
    });

    it('should resolve original vcard when ical throws error', function(done) {
      mockery.registerMock('@linagora/ical.js', {
        Component: function() {
          throw new Error('some error');
        }
      });
      var vcardData = 'an invalid vcard data';

      getModule().injectTextAvatar(user, bookId, bookName, vcardData).then(function(output) {
        expect(output).to.eql(vcardData);
        done();
      });
    });

    it('should resolve original vcard when getTextAvatarUrl rejects', function(done) {
      dependencies.helpers = {
        config: {
          getBaseUrl: function(user, callback) {
            callback(new Error());
          }
        }
      };
      var vcardData = 'some vcard data';

      getModule().injectTextAvatar(user, bookId, bookName, vcardData).then(function(output) {
        expect(output).to.eql(vcardData);
        done();
      });
    });
  });

  describe('The removeTextAvatar function', function() {

    it('should return vcard without text avatar URL', function() {
      var vcardData = ['vcard', [
        ['version', {}, 'text', '4.0'],
        ['uid', {}, 'text', cardId],
        ['photo', {}, 'uri', getAvatarUrl()]
      ]];

      expect(getModule().removeTextAvatar(vcardData)).to.eql(['vcard', [
        ['version', {}, 'text', '4.0'],
        ['uid', {}, 'text', cardId]
      ]]);
    });

    it('should return original vcard when vcard does not have text avatar', function() {
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', 'http://abc.com/avatar.png']
        ]
      ];
      expect(getModule().removeTextAvatar(vcardData)).to.eql(vcardData);
    });

    it('should return original vcard when ical throws error', function() {
      mockery.registerMock('@linagora/ical.js', {
        Component: function() {
          throw new Error('some error');
        }
      });

      var vcardData = 'a invalid vcard data';
      expect(getModule().removeTextAvatar(vcardData)).to.eql(vcardData);
    });
  });
});
