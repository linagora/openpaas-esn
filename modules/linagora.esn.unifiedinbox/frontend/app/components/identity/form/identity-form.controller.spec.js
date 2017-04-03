'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxIdentityFormController controller', function() {

  var $componentController, $rootScope, $state, inboxIdentitiesService;

  beforeEach(function() {
    module('jadeTemplates');
    module('linagora.esn.unifiedinbox', function($provide) {
      $provide.value('$state', {
        go: sinon.spy()
      });
      $provide.value('inboxIdentitiesService', {
        getIdentity: sinon.spy(function(id) {
          return $q.when(!id ? undefined : { id: id, isDefault: id === 'default' });
        }),
        storeIdentity: sinon.spy(function() {
          return $q.when();
        })
      });
    });
  });

  beforeEach(inject(function(_$rootScope_, _$componentController_, _$state_, _inboxIdentitiesService_) {
    $rootScope = _$rootScope_;
    $componentController = _$componentController_;
    $state = _$state_;

    inboxIdentitiesService = _inboxIdentitiesService_;
  }));

  describe('The $onInit function', function() {

    it('should load the identity during initialization', function() {
      var controller = $componentController('inboxIdentityForm', {}, { identityId: '1234' });

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.identity).to.deep.equal({ id: '1234', isDefault: false });
    });

    it('should initialize the identity to an empty object if no identityId is provided', function() {
      var controller = $componentController('inboxIdentityForm', {}, {});

      controller.$onInit();
      $rootScope.$digest();

      expect(controller.identity).to.deep.equal({});
      expect(inboxIdentitiesService.getIdentity).to.have.not.been.calledWith();
    });

  });

  describe('The saveIdentity function', function() {

    it('should save the identity', function() {
      var controller = $componentController('inboxIdentityForm', {}, { identityId: '1234' });

      controller.$onInit();
      $rootScope.$digest();

      controller.saveIdentity();

      expect(inboxIdentitiesService.storeIdentity).to.have.been.calledWith({ id: '1234', isDefault: false });
    });

    it('should create a new identity', function() {
      var controller = $componentController('inboxIdentityForm', {}, {});

      controller.$onInit();
      $rootScope.$digest();

      controller.identity.email = 'a@a.com';
      controller.saveIdentity();

      expect(inboxIdentitiesService.storeIdentity).to.have.been.calledWith({ email: 'a@a.com' });
    });

    it('should go to the identities state', function() {
      var controller = $componentController('inboxIdentityForm', {}, {});

      controller.$onInit();
      $rootScope.$digest();

      controller.saveIdentity();

      expect($state.go).to.have.been.calledWith('unifiedinbox.configuration.identities');
    });

  });

});
