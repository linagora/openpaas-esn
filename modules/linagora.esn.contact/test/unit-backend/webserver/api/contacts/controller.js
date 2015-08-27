'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var q = require('q');

describe('The contacts api controller', function() {
  var imageModuleMock, pubsubMock, loggerMock, davClientMock;
  var controller;

  beforeEach(function() {
    imageModuleMock = {
      avatarGenerationModule: {
        generateFromText: function() {
          return new Buffer('some data');
        },
        getColorsFromUuid: function(uuid) {
          return { bgColor: 'red', fgColor: 'white' };
        }
      }
    };

    pubsubMock = {
      local: {
        topic: function() {
          return {
            forward: function() {}
          };
        }
      },
      global: {}
    };

    loggerMock = {
      error: function() {},
      warn: function() {}
    };

    davClientMock = {
      get: function() {}
    };

    this.moduleHelpers.addDep('image', imageModuleMock);
    this.moduleHelpers.addDep('pubsub', pubsubMock);
    this.moduleHelpers.addDep('logger', loggerMock);
    mockery.registerMock('../../../lib/dav-client', davClientMock);

    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.contact/backend';
    controller = require(this.moduleHelpers.backendPath +
      '/webserver/api/contacts/controller')(this.moduleHelpers.dependencies);
  });

  describe('The _getContactAvatar private fn', function() {

    it('should use # character as an alternative when fn is not present', function(done) {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['photo', {}, 'uri', '']
        ],
        []
      ];

      imageModuleMock.avatarGenerationModule.generateFromText = function(options) {
        expect(options.text).to.equal('#');
        done();
      };

      controller._getContactAvatar(contact);
    });

    it('should use # character as an alternative when first letter of formatted name is not an alphabet', function(done) {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', '123'],
          ['photo', {}, 'uri', '']
        ],
        []
      ];

      imageModuleMock.avatarGenerationModule.generateFromText = function(options) {
        expect(options.text).to.equal('#');
        done();
      };

      controller._getContactAvatar(contact);
    });

    it('should generate if first letter of formatted name is an accented alphabet', function(done) {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'étienne'],
          ['photo', {}, 'uri', '']
        ],
        []
      ];

      imageModuleMock.avatarGenerationModule.generateFromText = function(options) {
        expect(options.text).to.equal('E');
        done();
      };

      controller._getContactAvatar(contact);
    });

    it('should generate if first letter of formatted name is an accented alphabet', function(done) {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'Đông Nhi'],
          ['photo', {}, 'uri', '']
        ],
        []
      ];

      imageModuleMock.avatarGenerationModule.generateFromText = function(options) {
        expect(options.text).to.equal('D');
        done();
      };

      controller._getContactAvatar(contact);
    });

    it('should depend on id to get colors when fn is present', function(done) {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'ABC'],
          ['photo', {}, 'uri', '']
        ],
        []
      ];

      imageModuleMock.avatarGenerationModule.getColorsFromUuid = function(uuid) {
        expect(uuid).to.equal('31b8e2b0-e776-4c66-8089-c7802f6c1dbc');
        done();
        return { bgColor: 'red', fgColor: 'white' };
      };
      controller._getContactAvatar(contact);

    });

    it('should call imageModule to generate avatar buffer', function(done) {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'ABC'],
          ['photo', {}, 'uri', '']
        ],
        []
      ];

      imageModuleMock.avatarGenerationModule.generateFromText = function(options) {
        expect(options.text).to.equal('A');
        expect(options.bgColor).to.equal('red');
        expect(options.fgColor).to.equal('white');
        expect(options.toBase64).to.be.undefined;
        done();
      };

      controller._getContactAvatar(contact);
    });

    it('should return image data of avatar', function() {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'ABC'],
          ['photo', {}, 'uri', '']
        ],
        []
      ];

      imageModuleMock.avatarGenerationModule.generateFromText = function(options) {
        return new Buffer('some data');
      };

      expect(controller._getContactAvatar(contact)).to.be.an.instanceof(Buffer);
    });

    it('should return URL string of avatar when photo is external link', function() {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'ABC'],
          ['photo', {}, 'uri', 'http://example.com/avatar.png']
        ],
        []
      ];
      expect(controller._getContactAvatar(contact))
        .to.equal('http://example.com/avatar.png');
    });

    it('should return buffer of avatar when photo is base64 string', function() {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'ABC'],
          ['photo', {}, 'uri', 'data:image/png;base64,abc=']
        ],
        []
      ];
      var avatar = controller._getContactAvatar(contact);
      expect(avatar.toString('base64')).to.equal('abc=');
    });

  });

  describe('The getAvatar fn', function() {

    it('should have 404 response when davClient.get rejects', function(done) {
      var req = {
        params: {},
        query: {}
      };
      var res = {
        status: function(code) {
          expect(code).to.equal(404);
          return {
            send: function(msg) {
              expect(msg).to.equal('Sorry, we cannot find avatar with your request!');
              done();
            }
          };
        }
      };
      davClientMock.get = function() {
        return q.reject();
      };
      controller.getAvatar(req, res);
    });

    it('should have response redirect when the contact has external image url', function(done) {
      var avatarUrl = 'http://example.com/avatar.png';
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'ABC'],
          ['photo', {}, 'uri', avatarUrl]
        ],
        []
      ];

      davClientMock.get = function() {
        return q.resolve(contact);
      };

      var req = {
        params: {},
        query: {}
      };

      var res = {
        redirect: function(url) {
          expect(url).to.equal(avatarUrl);
          done();
        }
      };

      controller.getAvatar(req, res);
    });

    it('should have buffer response when the contact has base64 avatar', function(done) {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'ABC'],
          ['photo', {}, 'uri', 'data:image/png;base64,abc=']
        ],
        []
      ];

      davClientMock.get = function() {
        return q.resolve(contact);
      };

      var req = {
        params: {},
        query: {}
      };

      var res = {
        type: function(contentType) {
          expect(contentType).to.equal('png');
        },
        send: function(data) {
          expect(data).to.be.an.instanceof(Buffer);
          done();
        }
      };

      controller.getAvatar(req, res);
    });

    it('should have buffer response when the contact has no avatar', function(done) {
      var contact = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', '31b8e2b0-e776-4c66-8089-c7802f6c1dbc'],
          ['fn', {}, 'text', 'ABC']
        ],
        []
      ];

      davClientMock.get = function() {
        return q.resolve(contact);
      };

      var req = {
        params: {},
        query: {}
      };

      var res = {
        type: function(contentType) {
          expect(contentType).to.equal('png');
        },
        send: function(data) {
          expect(data).to.be.an.instanceof(Buffer);
          done();
        }
      };

      controller.getAvatar(req, res);
    });

  });

});
