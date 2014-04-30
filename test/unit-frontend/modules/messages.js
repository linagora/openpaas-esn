'use strict';

describe('The Message Angular module', function() {

  beforeEach(angular.mock.module('esn.message'));

  describe('messagePOST service', function() {

    describe('post method', function() {

      beforeEach(angular.mock.inject(function(messageAPI, $httpBackend) {
        this.$httpBackend = $httpBackend;
        this.messagePOST = messageAPI;

        this.messageValue = 'messageValue';
      }));

      it('should send a POST request to a /api/message', function() {
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

        this.$httpBackend.expectPOST('/api/messages', message).respond();
        this.messagePOST.post(message.object.objectType, message.object, message.targets);
        this.$httpBackend.flush();
      });
    });
  });
});
