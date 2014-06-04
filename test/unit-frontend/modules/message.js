'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.message Angular module', function() {

  beforeEach(function() {
    angular.mock.module('esn.message');
  });

  describe('whatsupMessage directive', function() {

    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should display the message content', function() {
      var html = '<whatsup-message message="testMessage"></whatsup-message>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testMessage = { _id: 123456789,
        content: 'This is the message content',
        published: '123',
        author: {
          _id: '123456789',
          firstname: 'Foo',
          lastname: 'Bar'
        }
      };

      this.$rootScope.$digest();
      expect(element.html()).to.have.string(this.$rootScope.testMessage.content);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.published);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.author.firstname);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.author.lastname);
    });
  });

  describe('whatsupThread directive', function() {

    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should display the message thread', function() {
      var html = '<whatsup-thread message="testMessage"></whatsup-thread>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testMessage = { _id: 123456789,
        content: 'This is the message content',
        published: '123',
        author: {
          _id: '123456789',
          firstname: 'Foo',
          lastname: 'Bar'
        },
        responses: [
          {
            content: 'The first response',
            published: '456',
            author: {
              _id: '123456789',
              firstname: 'Foo1',
              lastname: 'Bar1'
            }
          },
          {
            content: 'The scond response',
            published: '789',
            author: {
              _id: '123456789',
              firstname: 'Foo2',
              lastname: 'Bar2'
            }
          }
        ]
      };

      this.$rootScope.$digest();
      expect(element.html()).to.have.string(this.$rootScope.testMessage.content);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.published);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.author.firstname);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.author.lastname);

      expect(element.html()).to.have.string(this.$rootScope.testMessage.responses[0].content);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.responses[0].published);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.responses[0].author.firstname);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.responses[0].author.lastname);

      expect(element.html()).to.have.string(this.$rootScope.testMessage.responses[1].content);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.responses[1].published);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.responses[1].author.firstname);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.responses[1].author.lastname);
    });
  });

  describe('messageController', function() {
    beforeEach(inject(function($rootScope, $controller) {
      this.messageAPI = {};
      this.rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.session = {};
      this.alert = function() {
      };

      $controller('messageController', {
        $scope: this.scope,
        messageAPI: this.messageAPI,
        $alert: this.alert,
        $rootScope: $rootScope
      });
    }));

    describe('sendMessage() method', function() {

      it('should not call $messageAPI.post when message is null', function(done) {
        this.messageAPI.post = function() {
          return done(new Error('Should not be called'));
        };
        this.scope.displayError = function() {
          done();
        };
        this.scope.whatsupmessage = undefined;
        this.scope.sendMessage();
      });

      it('should not call $messageAPI.post when message is empty', function(done) {
        this.messageAPI.post = function() {
          return done(new Error('Should not be called'));
        };
        this.scope.displayError = function() {
          done();
        };
        this.scope.whatsupmessage = '';
        this.scope.sendMessage();
      });

      it('should not call $messageAPI.post when $scope.activitystreamUuid is not set', function(done) {
        this.messageAPI.post = function() {
          return done(new Error('Should not be called'));
        };
        this.scope.displayError = function() {
          done();
        };
        this.scope.whatsupmessage = 'Hey Oh, let\'s go';
        this.scope.sendMessage();
      });

      it('should call $messageAPI.post when all data is set', function(done) {
        this.messageAPI.post = function() {
          done();
        };
        this.scope.displayError = function() {
          done(new Error());
        };
        this.scope.activitystreamUuid = '0987654321';
        this.scope.whatsupmessage = 'Hey Oh, let\'s go';
        this.scope.sendMessage();
      });

      describe('POST response', function() {

        it('should emit a message:posted event on rootScope', function(done) {
          this.messageAPI.post = function() {
            return {
              then: function(callback) {
                callback({
                  data: {
                    _id: 'message1'
                  }
                });
              }
            };
          };
          this.scope.displayError = function() {
            done(new Error());
          };
          this.scope.activitystreamUuid = '0987654321';
          this.scope.whatsupmessage = 'Hey Oh, let\'s go';
          this.rootScope.$on('message:posted', function(evt, data) {
            expect(data.activitystreamUuid).to.equal('0987654321');
            expect(data.id).to.equal('message1');
            done();
          });
          this.scope.sendMessage();
          this.rootScope.$digest();
        });
      });
    });
  });

  describe('messageCommentController controller', function() {

    beforeEach(inject(function($rootScope, $controller) {
      this.messageAPI = {};
      this.scope = $rootScope.$new();
      this.alert = function() {
      };

      $controller('messageCommentController', {
        $scope: this.scope,
        messageAPI: this.messageAPI,
        $alert: this.alert
      });
    }));

    it('$scope.addComment should not call the addComment API when $scope.message is undefined', function(done) {
      this.scope.displayError = function() {
        done();
      };
      this.scope.whatsupcomment = 'Hey Oh, let\'s go';
      this.scope.addComment();
    });

    it('$scope.addComment should not call the addComment API when $scope.whatsupcomment is empty', function(done) {
      this.scope.displayError = function() {
        done();
      };
      this.scope.whatsupcomment = '';
      this.scope.message = {
        _id: 123,
        objectType: 'whatsup'
      },
      this.scope.addComment();
    });

    it('$scope.addComment should not call the addComment API when $scope.whatsupcomment is null', function(done) {
      this.scope.displayError = function() {
        done();
      };
      this.scope.whatsupcomment = null;
      this.scope.message = {
        _id: 123,
        objectType: 'whatsup'
      },
      this.scope.addComment();
    });

    it('$scope.addComment should not call the addComment API when $scope.whatsupcomment contains only spaces', function(done) {
      this.scope.displayError = function() {
        done();
      };
      this.scope.whatsupcomment = '        ';
      this.scope.message = {
        _id: 123,
        objectType: 'whatsup'
      },
      this.scope.addComment();
    });

    it('$scope.addComment should call the addComment API when all data is set', function(done) {
      this.messageAPI.addComment = function() {
        done();
      };
      this.scope.displayError = function() {
        done(new Error());
      };
      this.scope.whatsupcomment = 'Hey Oh, let\'s go';
      this.scope.message = {
        _id: 123,
        objectType: 'whatsup'
      },
      this.scope.addComment();
    });

    it('$scope.addComment should not call the addComment API when $scope.sending is true', function(done) {
      this.scope.sending = true;
      this.messageAPI.addComment = function() {
        done(new Error('Should not be called'));
      };
      this.scope.displayError = function(err) {
        done();
      };
      this.scope.message = {
        _id: 123,
        objectType: 'whatsup'
      };
      this.scope.whatsupcomment = 'Hey Oh, let\'s go';
      this.scope.addComment();
    });
  });

  describe('messageAPI service', function() {

    beforeEach(inject(function(messageAPI, $httpBackend) {
      this.api = messageAPI;
      this.$httpBackend = $httpBackend;
    }));

    describe('get() method', function() {
      it('should issue a GET /messages/:uuid if a string is given as argument', function() {
        this.$httpBackend.expectGET('/messages/MSG1').respond({});
        this.api.get('MSG1');
        this.$httpBackend.flush();
      });

      it('should issue a GET /messages if an object is given as argument', function() {
        this.$httpBackend.expectGET('/messages').respond([]);
        this.api.get({});
        this.$httpBackend.flush();
      });

      it('should allow passing parameters given as argument', function() {
        this.$httpBackend.expectGET('/messages?foo=bar&test=true').respond([]);
        this.api.get({test: true, foo: 'bar'});
        this.$httpBackend.flush();
      });

      it('should tokenize array like parameters', function() {
        this.$httpBackend.expectGET('/messages?test%5B%5D=foo&test%5B%5D=bar').respond([]);
        this.api.get({'test[]': ['foo', 'bar']});
        this.$httpBackend.flush();
      });
    });

    describe('post method', function() {

      beforeEach(angular.mock.inject(function() {
        this.messageValue = 'messageValue';
      }));

      it('should send a POST request to /messages', function() {
        var message = {
          'object': {
            'objectType': 'whatsup',
            'description': 'whatsup message content'
          },
          'targets': [
            {
              'objectType': 'wall',
              'id': 'urn:linagora:esn:wall:<wall uuid>'
            }
          ]
        };

        this.$httpBackend.expectPOST('/messages', message).respond();
        this.api.post(message.object.objectType, message.object, message.targets);
        this.$httpBackend.flush();
      });
    });

    describe('addComment method', function() {

      it('should send a POST request to /messages', function() {
        var message = {
          'object': {
            'objectType': 'whatsup',
            'description': 'whatsup response content'
          },
          'inReplyTo': [
            {
              'objectType': 'whatsup',
              'id': 'urn:linagora:esn:whatsup:<message uuid>'
            }
          ]
        };

        this.$httpBackend.expectPOST('/messages', message).respond();
        this.api.addComment(message.object.objectType, message.object, message.inReplyTo);
        this.$httpBackend.flush();
      });
    });
  });
});
