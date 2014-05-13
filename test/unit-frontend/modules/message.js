'use strict';

describe('The esn.message Angular module', function() {

  beforeEach(function() {
    angular.mock.module('esn.message');
  });

  describe('messageController', function() {
    beforeEach(inject(function($rootScope, $controller) {
      this.messageAPI = {};
      this.scope = $rootScope.$new();
      this.session = {};
      this.alert = function() {
      };

      $controller('messageController', {
        $scope: this.scope,
        messageAPI: this.messageAPI,
        session: this.session,
        $alert: this.alert
      });
    }));

    it('$scope.sendMessage should not call $messageAPI.post when message is null', function(done) {
      this.messageAPI.post = function() {
        return done(new Error('Should not be called'));
      };
      this.scope.displayError = function() {
        done();
      };
      this.scope.whatsupmessage = undefined;
      this.scope.sendMessage();
    });

    it('$scope.sendMessage should not call $messageAPI.post when message is empty', function(done) {
      this.messageAPI.post = function() {
        return done(new Error('Should not be called'));
      };
      this.scope.displayError = function() {
        done();
      };
      this.scope.whatsupmessage = '';
      this.scope.sendMessage();
    });

    it('$scope.sendMessage should not call $messageAPI.post when session domain is not set', function(done) {
      this.messageAPI.post = function() {
        return done(new Error('Should not be called'));
      };
      this.scope.displayError = function() {
        done();
      };
      this.scope.whatsupmessage = 'Hey Oh, let\'s go';
      this.scope.sendMessage();
      done();
    });

    it('$scope.sendMessage should not call $messageAPI.post when session domain.activity_stream is not set', function(done) {
      this.messageAPI.post = function() {
        return done(new Error('Should not be called'));
      };
      this.scope.displayError = function() {
        done();
      };
      this.session.domain = {};
      this.scope.whatsupmessage = 'Hey Oh, let\'s go';
      this.scope.sendMessage();
      done();
    });

    it('$scope.sendMessage should not call $messageAPI.post when session domain.activity_stream.uuid is not set', function(done) {
      this.messageAPI.post = function() {
        return done(new Error('Should not be called'));
      };
      this.scope.displayError = function() {
        done();
      };
      this.session.domain = {
        activity_stream: {
        }
      };
      this.scope.whatsupmessage = 'Hey Oh, let\'s go';
      this.scope.sendMessage();
      done();
    });

    it('$scope.sendMessage should call $messageAPI.post when all data is set', function(done) {
      this.messageAPI.post = function() {
        done();
      };
      this.scope.displayError = function() {
        done(new Error());
      };
      this.session.domain = {
        activity_stream: {
          uuid: '1234'
        }
      };
      this.scope.whatsupmessage = 'Hey Oh, let\'s go';
      this.scope.sendMessage();
      done();
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
  });
});
