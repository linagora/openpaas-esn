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
      config: function() {
        return {};
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

    it('should inject text avatar url to vcard', function() {
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz']
        ]
      ];
      var output = getModule().injectTextAvatar(123, vcardData);
      var avatarUrl = 'http://localhost:8080/contact/api/contacts/123/xyz/avatar';
      var expectedOutput = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', avatarUrl]
        ]
      ];
      expect(output).to.eql(expectedOutput);
    });

    it('should have text avatar url based on base_url configuration', function() {
      dependencies.config = function() {
        return {
          base_url: 'http://open-paas.org'
        };
      };
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz']
        ]
      ];
      var output = getModule().injectTextAvatar(123, vcardData);
      var avatarUrl = 'http://open-paas.org/contact/api/contacts/123/xyz/avatar';
      var expectedOutput = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', avatarUrl]
        ]
      ];
      expect(output).to.eql(expectedOutput);
    });

    it('should return original vcard when it has photo data already', function() {
      var vcardData = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', 'some data here']
        ]
      ];
      var output = getModule().injectTextAvatar(123, vcardData);
      expect(output).to.eql(vcardData);
    });

    it('should return original vcard when ical throws error', function() {
      mockery.registerMock('ical.js', {
        Component: function() {
          throw new Error('some error');
        }
      });
      var vcardData = 'a invalid vcard data';
      var output = getModule().injectTextAvatar(123, vcardData);

      expect(output).to.eql(vcardData);
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
