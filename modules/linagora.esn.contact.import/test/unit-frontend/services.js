'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The Contact Import Angular Services', function() {

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact.import');
  });

  describe('The ContactImporterService service', function() {

    beforeEach(angular.mock.inject(function($rootScope, $httpBackend, ContactImporterService) {
      this.$httpBackend = $httpBackend;
      this.$rootScope = $rootScope;
      this.$scope = $rootScope.$new();
      this.ContactImporterService = ContactImporterService;
    }));

    it('should send POST request to /import/api/:type', function() {
      var type = 'twitter';
      var id = 123;
      var account = {
        data: {
          id: id
        }
      };

      this.$httpBackend.expectPOST('/import/api/' + type, {account_id: id}).respond([]);
      this.ContactImporterService.import(type, account);
      this.$rootScope.$apply();
      this.$httpBackend.flush();
    });
  });

  describe('The ContactImportRegistry service', function() {

    beforeEach(angular.mock.inject(function(ContactImportRegistry, $rootScope) {
      this.$rootScope = $rootScope;
      this.ContactImportRegistry = ContactImportRegistry;
    }));

    it('should send back the registered function', function() {
      var provider = function() {
        return 1;
      };
      var type = 'twitter';

      this.ContactImportRegistry.register(type, provider);
      var result = this.ContactImportRegistry.get(type);
      expect(result()).to.equal(1);
    });

    it('should not return the function if not registered', function() {
      var type = 'other';

      var result = this.ContactImportRegistry.get(type);
      expect(result).to.not.exist;
    });

  });

  describe('The ContactImporter Service', function() {

    var ContactImportRegistryMock, notificationFactory;

    beforeEach(function() {
      notificationFactory = {};
      ContactImportRegistryMock = {};

      module(function($provide) {
        $provide.value('ContactImportRegistry', ContactImportRegistryMock);
        $provide.value('notificationFactory', notificationFactory);
      });

      inject(function(_$compile_, _$rootScope_, _ContactImporter_) {
        this.$rootScope = _$rootScope_;
        this.ContactImporter = _ContactImporter_;
      });
    });

    describe('The import fn', function() {

      it('should notify when importing without error', function(done) {
        var account = {
          provider: 'twitter',
          data: {
            username: 'awesomepaas',
            id: 123
          }
        };

        notificationFactory.notify = function(type) {
          expect(type).to.equal('info');
          done();
        };

        ContactImportRegistryMock.get = function() {
          return {
            import: function(account) {
              expect(account).to.deep.equal(account);
              return $q.when({status: 202});
            }
          };
        };

        this.ContactImporter.import('twitter', account);
        this.$rootScope.$digest();
      });

      it('should not notify when response status code is invalid', function(done) {
        var account = {
          provider: 'twitter',
          data: {
            username: 'awesomepaas',
            id: 123
          }
        };

        notificationFactory.notify = function() {
          done(new Error());
        };

        ContactImportRegistryMock.get = function() {
          return {
            import: function(account) {
              expect(account).to.deep.equal(account);
              return $q.when({status: 200});
            }
          };
        };

        this.ContactImporter.import('twitter', account);
        this.$rootScope.$digest();
        done();
      });

      it('should notify when import error', function(done) {
        var account = {
          provider: 'twitter',
          data: {
            username: 'awesomepaas',
            id: 123
          }
        };

        notificationFactory.notify = function(type) {
          expect(type).to.equal('danger');
          done();
        };

        ContactImportRegistryMock.get = function() {
          return {
            import: function(account) {
              expect(account).to.deep.equal(account);
              return $q.reject();
            }
          };
        };

        this.ContactImporter.import('twitter', account);
        this.$rootScope.$digest();
      });
    });
  });

  describe('The ContactImportMessageRegistry service', function() {
    var ContactImportMessageRegistry, CONTACT_IMPORT_DEFAULT_MESSAGES, CONTACT_IMPORT_UNKNOWN_MESSAGE;

    beforeEach(function() {
      angular.mock.inject(function(_ContactImportMessageRegistry_, _CONTACT_IMPORT_DEFAULT_MESSAGES_, _CONTACT_IMPORT_UNKNOWN_MESSAGE_) {
        ContactImportMessageRegistry = _ContactImportMessageRegistry_;
        CONTACT_IMPORT_DEFAULT_MESSAGES = _CONTACT_IMPORT_DEFAULT_MESSAGES_;
        CONTACT_IMPORT_UNKNOWN_MESSAGE = _CONTACT_IMPORT_UNKNOWN_MESSAGE_;
      });
    });

    it('should send back a registered messages', function() {
      var provider = 'a provider';
      var type = 'ACCOUNT_ERROR';
      var message = 'This is account error detail';
      var messages = {};
      messages[type] = message;
      ContactImportMessageRegistry.register(provider, messages);
      expect(ContactImportMessageRegistry.get(provider, type)).to.equal(message);
    });

    it('should send back the default message when provider is not found', function() {
      var provider = 'a provider';
      var type = 'ACCOUNT_ERROR';
      var message = 'This is account error detail';
      var messages = {};
      messages[type] = message;
      ContactImportMessageRegistry.register(provider, messages);

      expect(ContactImportMessageRegistry.get('another provider', type)).to.equal(CONTACT_IMPORT_DEFAULT_MESSAGES[type]);
    });

    it('should send back the default message when type is not found in provider', function() {
      var provider = 'a provider';
      var type = 'ACCOUNT_ERROR';
      var messages = {};
      ContactImportMessageRegistry.register(provider, messages);

      expect(ContactImportMessageRegistry.get(provider, type)).to.equal(CONTACT_IMPORT_DEFAULT_MESSAGES[type]);
    });

    it('should send back the unknown message when type is not found in provider nor defaults', function() {
      var provider = 'a provider';
      var type = 'ACCOUNT_ERROR';
      var message = 'This is account error detail';
      var messages = {};
      messages[type] = message;
      ContactImportMessageRegistry.register(provider, messages);

      expect(ContactImportMessageRegistry.get(provider, 'invalid type')).to.equal(CONTACT_IMPORT_UNKNOWN_MESSAGE);
    });

  });

  describe('The ContactImportNotificationService', function() {
    var ContactImportNotificationService, CONTACT_IMPORT_SIO_NAMESPACE;

    function injectService() {
      angular.mock.inject(function(_ContactImportNotificationService_, _CONTACT_IMPORT_SIO_NAMESPACE_) {
        ContactImportNotificationService = _ContactImportNotificationService_;
        CONTACT_IMPORT_SIO_NAMESPACE = _CONTACT_IMPORT_SIO_NAMESPACE_;
      });
    }

    beforeEach(function() {
      ContactImportNotificationService = null;
    });

    describe('The startListen fn', function() {

      it('should listen to notification with right namespace and room', function(done) {
        var roomId = 'a room id';
        angular.mock.module(function($provide) {
          $provide.value('livenotification', function(namespace, roomId) {
            expect(namespace).to.equal(CONTACT_IMPORT_SIO_NAMESPACE);
            expect(roomId).to.equal(roomId);
            done();
            return {
              on: angular.noop
            };
          });
        });
        injectService();
        ContactImportNotificationService.startListen(roomId);
      });

      it('should listen to notification once', function() {
        var roomId = 'a room id';
        var onFnSpy = sinon.spy();
        var spy = sinon.spy(function() {
          return { on: onFnSpy };
        });
        angular.mock.module(function($provide) {
          $provide.value('livenotification', spy);
        });
        injectService();
        ContactImportNotificationService.startListen(roomId);
        ContactImportNotificationService.startListen(roomId);
        expect(spy.callCount).to.equal(1);
        expect(onFnSpy.callCount).to.equal(3);
      });

    });

    describe('The stopListen fn', function() {

      it('should remove all listeners', function() {
        var roomId = 'a room id';
        var removeListenerFnSpy = sinon.spy();
        var spy = sinon.spy(function() {
          return { on: angular.noop, removeListener: removeListenerFnSpy };
        });
        angular.mock.module(function($provide) {
          $provide.value('livenotification', spy);
        });
        injectService();
        ContactImportNotificationService.startListen(roomId);
        ContactImportNotificationService.stopListen();
        expect(removeListenerFnSpy.callCount).to.equal(3);
      });

    });

  });

});
