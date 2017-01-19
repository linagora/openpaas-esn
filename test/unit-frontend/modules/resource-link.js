'use strict';

describe('The esn.resource-link Angular module', function() {

  beforeEach(angular.mock.module('esn.resource-link'));
  beforeEach(module('jadeTemplates'));

  describe('The ResourceLinkAPI factory', function() {

    beforeEach(inject(function(ResourceLinkAPI, $httpBackend) {
      this.ResourceLinkAPI = ResourceLinkAPI;
      this.$httpBackend = $httpBackend;
    }));

    describe('The create function', function() {
      it('should send a valid request', function() {
        var source = {
          objectType: 'user',
          id: '123'
        };

        var target = {
          objectType: 'esn.message',
          id: '456'
        };

        var type = 'like';

        var value = '+1';

        this.$httpBackend.expectPOST('/api/resource-links', {
          source: source,
          target: target,
          type: type,
          value: value
        }).respond();
        this.ResourceLinkAPI.create(source, target, type, value);
        this.$httpBackend.flush();
      });
    });
    describe('The remove function', function() {
      it('should send a valid request', function(done) {
        var source = {
          objectType: 'user',
          id: '123'
        };

        var target = {
          objectType: 'esn.message',
          id: '456'
        };

        var type = 'like';

        this.$httpBackend.expect('DELETE', '/api/resource-links', {
          source: source,
          target: target,
          type: type
        }, {'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*'}).respond(204);
        this.ResourceLinkAPI
          .remove(source, target, type)
          .then(function() {
            done();
          });
        this.$httpBackend.flush();
      });
    });
  });
});
