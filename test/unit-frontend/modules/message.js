'use strict';

describe('The esn.message Angular module', function() {
  describe('messageAPI service', function() {

    beforeEach(function() {
      angular.mock.module('esn.message');
    });
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

  });
});
