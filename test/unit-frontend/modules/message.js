'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.message Angular module', function() {

  beforeEach(function() {
    angular.mock.module('esn.message');
  });

  describe('messagesAttachment directive', function() {

    beforeEach(module('jadeTemplates'));
    beforeEach(module('esn.core'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should display an attachment', function() {
      var html = '<message-attachment attachment="testAttachment"></messages-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testAttachment = {
        id: 456, name: 'ms.doc', contentType: 'application/doc', length: 10240
      };

      this.$rootScope.$digest();
      expect(element.html()).to.have.string(this.$rootScope.testAttachment.name);
    });

    it('The getClass fn should return the fa-file-text fontwasome class for application', function(done) {
      var html = '<message-attachment attachment="testAttachment"></messages-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testAttachment = {
        id: 456, name: 'openpaas.pdf', contentType: 'application/pdf', length: 10240
      };

      this.$rootScope.$digest();
      expect(element.children().scope().getClass(this.$rootScope.testAttachment.contentType)).to.equal('fa-file-text');
      done();
    });

    it('The getClass fn should return the fa-file-image-o fontwasome class for image', function(done) {
      var html = '<message-attachment attachment="testAttachment"></messages-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testAttachment = {
        id: 456, name: 'openpaas.pdf', contentType: 'image/png', length: 10240
      };

      this.$rootScope.$digest();
      expect(element.children().scope().getClass(this.$rootScope.testAttachment.contentType)).to.equal('fa-file-image-o');
      done();
    });

    it('The getClass fn should return the fa-file-video-o fontwasome class for video', function(done) {
      var html = '<message-attachment attachment="testAttachment"></messages-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testAttachment = {
        id: 456, name: 'openpaas.pdf', contentType: 'video/mp4', length: 10240
      };

      this.$rootScope.$digest();
      expect(element.children().scope().getClass(this.$rootScope.testAttachment.contentType)).to.equal('fa-file-video-o');
      done();
    });

    it('The getClass fn should return the fa-file-o fontwasome class for unknown type', function(done) {
      var html = '<message-attachment attachment="testAttachment"></messages-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testAttachment = {
        id: 456, name: 'openpaas.pdf', contentType: 'foo/bar', length: 10240
      };

      this.$rootScope.$digest();
      expect(element.children().scope().getClass(this.$rootScope.testAttachment.contentType)).to.equal('fa-file-o');
      done();
    });
  });

  describe('messagesAttachments directive', function() {

    beforeEach(module('jadeTemplates'));
    beforeEach(module('esn.core'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should display the attachments', function() {
      var html = '<message-attachments message="testMessage"></message-attachments>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testMessage = { _id: 123456789,
        objectType: 'whatsup',
        content: 'This is the message content',
        published: '123',
        author: {
          _id: '123456789',
          firstname: 'Foo',
          lastname: 'Bar'
        },
        attachments: [
          {id: 123, name: 'foo.png', contentType: 'application/png', length: 1024},
          {id: 456, name: 'ms.doc', contentType: 'application/doc', length: 10240}
        ]
      };

      this.$rootScope.$digest();
      expect(element.html()).to.have.string(this.$rootScope.testMessage.attachments[0].name);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.attachments[1].name);
    });
  });


  describe('messagesTemplatesDisplayer directive', function() {

    beforeEach(module('jadeTemplates'));
    beforeEach(module('angularMoment'));
    beforeEach(module('esn.profile'));
    beforeEach(module('esn.core'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should display a whatsup message', function() {
      var html = '<messages-display message="testMessage"></messages-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testMessage = { _id: 123456789,
        objectType: 'whatsup',
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

    it('should display an email message', function() {
      var html = '<messages-display message="testMessage"></messages-display>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testMessage = {
        _id: '54218311d49dc10000439d4b',
        author: '5375de9fd684db7f6fbd5010',
        body: {
          html: '<b>Hello</b>',
          text: 'hello'
        },
        parsedHeaders: {
          subject: 'Re: User notification data model proposal 2',
          bcc: [],
          cc: [
            {
              address: 'cc@linagora.com',
              name: 'First Last',
              _id: 1
            }
          ],
          from: {
            address: 'gcrosmarie@linagora.com',
            name: 'Graham Crosmarie',
            _id: 2
          },
          to: [
            {
              address: 'mbailly@linagora.com',
              name: 'Michael Bailly',
              _id: 3
            },
            {
              address: 'ldubois@linagora.com',
              name: 'Laurent DUBOIS',
              _id: 4
            },
            {
              address: 'chamerling@linagora.com',
              name: 'Christophe HAMERLING',
              _id: 5
            },
            {
              address: 'slemaistre@linagora.com',
              name: 'Stephen LE MAISTRE',
              _id: 6
            },
            {
              address: 'rpignolet@linagora.com',
              name: 'Romain PIGNOLET',
              _id: 7
            },
            {
              address: 'pkewisch@linagora.com',
              name: 'Philipp KEWISCH',
              _id: 8
            }
          ]
        },
        objectType: 'email',
        timestamps: {
          creation: new Date(1411482385233)
        }
      };

      this.$rootScope.$digest();
      expect(element.html()).to.have.string(this.$rootScope.testMessage.body.text);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.parsedHeaders.from.address);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.parsedHeaders.to[0].address);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.parsedHeaders.to[1].address);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.parsedHeaders.to[2].address);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.parsedHeaders.to[3].address);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.parsedHeaders.to[4].address);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.parsedHeaders.to[5].address);
      expect(element.html()).to.have.string(this.$rootScope.testMessage.parsedHeaders.cc[0].address);
    });
  });

  describe('messagesThread directive', function() {

    beforeEach(module('jadeTemplates'));
    beforeEach(module('angularMoment'));
    beforeEach(module('esn.core'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    it('should display the message thread', function() {
      var html = '<messages-thread message="testMessage"></messages-thread>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.testMessage = { _id: 123456789,
        objectType: 'whatsup',
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
            objectType: 'whatsup',
            published: '456',
            author: {
              _id: '123456789',
              firstname: 'Foo1',
              lastname: 'Bar1'
            }
          },
          {
            content: 'The scond response',
            objectType: 'whatsup',
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
    beforeEach(inject(function($rootScope, $controller, $q) {
      this.messageAPI = {};
      this.rootScope = $rootScope;
      this.$q = $q;
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

      it('should display a warning when user is not authorized to post message', function(done) {
        var defer = this.$q.defer();
        this.messageAPI.post = function() {
          return defer.promise;
        };
        this.scope.displayError = function(err) {
          expect(err).to.match(/You do not have enough rights to write a new message here/);
          done();
        };
        defer.reject({data: {status: 403}});
        this.scope.activitystreamUuid = '0987654321';
        this.scope.whatsupmessage = 'Hey Oh, let\'s go';
        this.scope.sendMessage();
        this.scope.$digest();
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

    beforeEach(inject(function($rootScope, $controller, $q) {
      this.messageAPI = {};
      this.rootScope = $rootScope;
      this.$q = $q;
      this.scope = $rootScope.$new();
      this.alert = function() {
      };

      $controller('messageCommentController', {
        $scope: this.scope,
        messageAPI: this.messageAPI,
        $alert: this.alert,
        $rootScope: this.rootScope
      });
    }));

    describe('addComment() directive', function() {
      it('should not call the addComment API when $scope.message is undefined', function(done) {
        this.scope.displayError = function() {
          done();
        };
        this.scope.whatsupcomment = 'Hey Oh, let\'s go';
        this.scope.addComment();
      });

      it('should not call the addComment API when $scope.whatsupcomment is empty', function(done) {
        this.scope.displayError = function() {
          done();
        };
        this.scope.whatsupcomment = '';
        this.scope.message = {
          _id: 123,
          objectType: 'whatsup'
        };
        this.scope.addComment();
      });

      it('should not call the addComment API when $scope.whatsupcomment is null', function(done) {
        this.scope.displayError = function() {
          done();
        };
        this.scope.whatsupcomment = null;
        this.scope.message = {
          _id: 123,
          objectType: 'whatsup'
        };
        this.scope.addComment();
      });

      it('should not call the addComment API when $scope.whatsupcomment contains only spaces', function(done) {
        this.scope.displayError = function() {
          done();
        };
        this.scope.whatsupcomment = '        ';
        this.scope.message = {
          _id: 123,
          objectType: 'whatsup'
        };
        this.scope.addComment();
      });

      it('should set $scope.sending to true when all data is set', function(done) {
        var scope = this.scope;
        this.messageAPI.addComment = function() {
          expect(scope.sending).to.be.true;
          done();
        };
        this.scope.displayError = function() {
          done(new Error());
        };
        this.scope.whatsupcomment = 'Hey Oh, let\'s go';
        this.scope.message = {
          _id: 123,
          objectType: 'whatsup'
        };
        this.scope.addComment();
      });

      it('should call the addComment API when all data is set', function(done) {
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
        };
        this.scope.addComment();
      });

      it('should not call the addComment API when $scope.sending is true', function(done) {
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

      describe('addComment response', function() {
        it('should call the scope.shrink() method', function(done) {
          this.messageAPI.addComment = function() {
            return {
              then: function(callback) {
                callback({data: {_id: 'comment1'}});
              }
            };
          };
          this.scope.shrink = done;
          this.scope.displayError = function() {
            done(new Error('Should not call display error'));
          };
          this.scope.whatsupcomment = 'Hey Oh, let\'s go';
          this.scope.message = {
            _id: 123,
            objectType: 'whatsup'
          };
          this.scope.addComment();
        });

        it('should set scope.sending to false', function(done) {
          var scope = this.scope;
          this.messageAPI.addComment = function() {
            return {
              then: function(callback) {
                callback({data: {_id: 'comment1'}});
                expect(scope.sending).to.be.false;
                done();
              }
            };
          };
          this.scope.shrink = function() {};
          this.scope.displayError = function() {
            done(new Error('Should not call display error'));
          };
          this.scope.whatsupcomment = 'Hey Oh, let\'s go';
          this.scope.message = {
            _id: 123,
            objectType: 'whatsup'
          };
          this.scope.addComment();
        });

        it('should set scope.whatsupcomment to an empty string', function(done) {
          var scope = this.scope;
          this.messageAPI.addComment = function() {
            return {
              then: function(callback) {
                callback({data: {_id: 'comment1'}});
                expect(scope.whatsupcomment).to.be.a.string;
                expect(scope.whatsupcomment).to.have.length(0);
                done();
              }
            };
          };
          this.scope.shrink = function() {};
          this.scope.displayError = function() {
            done(new Error('Should not call display error'));
          };
          this.scope.whatsupcomment = 'Hey Oh, let\'s go';
          this.scope.message = {
            _id: 123,
            objectType: 'whatsup'
          };
          this.scope.addComment();
        });

        it('should emit a message:comment event on rootScope', function(done) {
          var scope = this.scope;
          this.messageAPI.addComment = function() {
            return {
              then: function(callback) {
                callback({data: {_id: 'comment1'}});
              }
            };
          };
          this.scope.shrink = function() {};
          this.scope.displayError = function() {
            done(new Error('Should not call display error'));
          };
          this.scope.whatsupcomment = 'Hey Oh, let\'s go';
          this.scope.message = {
            _id: 123,
            objectType: 'whatsup'
          };
          this.rootScope.$on('message:comment', function(evt, data) {
            expect(data.id).to.equal('comment1');
            expect(data.parent).to.deep.equal(scope.message);
            done();
          });
          this.scope.addComment();
        });

        it('should display warning if user does not have rights to comment message', function(done) {
          var defer = this.$q.defer();
          this.messageAPI.addComment = function() {
            return defer.promise;
          };
          defer.reject({data: {status: 403}});
          this.scope.shrink = function() {};
          this.scope.displayError = function(err) {
            expect(err).to.match(/You do not have enough rights to write a response here/);
            done();
          };
          this.scope.whatsupcomment = 'Hey Oh, let\'s go';
          this.scope.message = {
            _id: 123,
            objectType: 'whatsup'
          };
          this.scope.addComment();
          this.scope.$digest();
        });
      });

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
