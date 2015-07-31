'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The avatarHelper module', function() {

  var deps, dependencies;

  beforeEach(function() {
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
      }
    };
    deps = function(name) {
      return dependencies[name];
    };
  });

  function getModule() {
    return require('../../../../backend/webserver/addressbooks/avatarHelper')(deps);
  }


  describe('The injectTextAvatar function', function() {

    it('should inject text avatar url to vcard using DEFAULT_BASE_URL', function(done) {
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz']
        ]
      ];
      var avatarUrl = 'http://localhost:8080/contact/api/contacts/123/xyz/avatar';
      var expectedOutput = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', avatarUrl]
        ]
      ];
      getModule().injectTextAvatar(123, vcardData).then(function(output) {
        expect(output).to.eql(expectedOutput);
        done();
      });
    });

    it('should have text avatar url based on base_url of esnconfig', function(done) {
      var baseUrl = 'http://dev.open-paas.org';
      dependencies['esn-config'] = function() {
        return {
          get: function(callback) {
            callback(null, { base_url: baseUrl });
          }
        };
      };
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz']
        ]
      ];
      var avatarUrl = baseUrl + '/contact/api/contacts/123/xyz/avatar';
      var expectedOutput = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', avatarUrl]
        ]
      ];
      getModule().injectTextAvatar(123, vcardData).then(function(output) {
        expect(output).to.eql(expectedOutput);
        done();
      });
    });

    it('should resolve original vcard when it has photo data already', function(done) {
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', 'some data here']
        ]
      ];
      getModule().injectTextAvatar(123, vcardData).then(function(output) {
        expect(output).to.eql(vcardData);
        done();
      });
    });

    it('should resolve original vcard when ical throws error', function(done) {
      mockery.registerMock('ical.js', {
        Component: function() {
          throw new Error('some error');
        }
      });
      var vcardData = 'a invalid vcard data';
      getModule().injectTextAvatar(123, vcardData).then(function(output) {
        expect(output).to.eql(vcardData);
        done();
      });
    });

    it('should resolve original vcard when getTextAvatarUrl rejects', function(done) {
      dependencies['esn-config'] = function() {
        return {
          get: function(callback) {
            callback('some error');
          }
        };
      };
      var vcardData = 'some vcard data';
      getModule().injectTextAvatar(123, vcardData).then(function(output) {
        expect(output).to.eql(vcardData);
        done();
      });
    });

  });


  describe('The removeTextAvatar function', function() {

    it('should return vcard without text avatar URL', function() {
      var avatarUrl = 'http://localhost:8080/contact/api/contacts/123/xyz/avatar';
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', avatarUrl]
        ]
      ];
      var output = getModule().removeTextAvatar(vcardData);
      var expectedOutput = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz']
        ]
      ];
      expect(output).to.eql(expectedOutput);
    });

    it('should return original vcard when vcard doesnt have text avatar', function() {
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', 'http://abc.com/avatar.png']
        ]
      ];
      var output = getModule().removeTextAvatar(vcardData);
      expect(output).to.eql(vcardData);
    });

    it('should return original vcard when ical throws error', function() {
      mockery.registerMock('ical.js', {
        Component: function() {
          throw new Error('some error');
        }
      });

      var vcardData = 'a invalid vcard data';
      var output = getModule().removeTextAvatar(vcardData);
      expect(output).to.eql(vcardData);
    });

  });

});
