'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The inboxIdentitiesService factory', function() {

  var $rootScope, $httpBackend, config, esnUserConfigurationService, inboxIdentitiesService, defaultIdentity;

  beforeEach(module('linagora.esn.unifiedinbox', function($provide) {
    config = {};
    esnUserConfigurationService = {
      set: sinon.spy()
    };

    $provide.value('esnConfig', function(key, defaultValue) {
      return $q.when().then(function() {
        return angular.isDefined(config[key]) ? config[key] : defaultValue;
      });
    });
    $provide.value('esnUserConfigurationService', esnUserConfigurationService);
    $provide.value('uuid4', {
      generate: function() {
        return '1234';
      }
    });
  }));

  beforeEach(inject(function(_$rootScope_, _$httpBackend_, _inboxIdentitiesService_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    inboxIdentitiesService = _inboxIdentitiesService_;
  }));

  beforeEach(function() {
    defaultIdentity = { id: 'default', isDefault: true };
    $httpBackend.expectGET('/unifiedinbox/api/inbox/identities/default').respond(200, defaultIdentity);
  });

  describe('The getDefaultIdentity function', function() {

    it('should return the default identity', function(done) {
      inboxIdentitiesService.getDefaultIdentity().then(function(identity) {
        expect(identity).to.deep.equal(defaultIdentity);

        done();
      });
      $httpBackend.flush();
    });

  });

  describe('The removeIdentity function', function() {

    it('should not allow to remove the default identity', function(done) {
      inboxIdentitiesService.removeIdentity(defaultIdentity).catch(function() {
        done();
      });
      $httpBackend.flush();
    });

    it('should remove the identity', function(done) {
      var identity = { id: 'id', email: 'b@b.com' };

      config['linagora.esn.unifiedinbox.identities'] = [identity];

      inboxIdentitiesService.removeIdentity(identity);
      $httpBackend.flush();

      expect(esnUserConfigurationService.set).to.have.been.calledWith([
        {
          name: 'identities',
          value: []
        }
      ], 'linagora.esn.unifiedinbox');

      inboxIdentitiesService.getAllIdentities().then(function(identities) {
        expect(identities).to.deep.equal([defaultIdentity]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The storeIdentity function', function() {

    it('should store a new identity with a generated ID', function(done) {
      inboxIdentitiesService.storeIdentity({ email: 'a@a.com' });
      $httpBackend.flush();

      expect(esnUserConfigurationService.set).to.have.been.calledWith([
        {
          name: 'identities',
          value: [
            {
              id: '1234',
              email: 'a@a.com'
            }
          ]
        }
      ], 'linagora.esn.unifiedinbox');

      inboxIdentitiesService.getAllIdentities().then(function(identities) {
        expect(identities).to.deep.equal([
          { id: 'default', isDefault: true },
          { id: '1234', email: 'a@a.com' }
        ]);

        done();
      });
      $rootScope.$digest();
    });

    it('should store an existing identity', function(done) {
      var identity = { id: 'id', email: 'b@b.com' };

      config['linagora.esn.unifiedinbox.identities'] = [identity];

      inboxIdentitiesService.storeIdentity(identity);
      $httpBackend.flush();

      expect(esnUserConfigurationService.set).to.have.been.calledWith([
        {
          name: 'identities',
          value: [identity]
        }
      ], 'linagora.esn.unifiedinbox');

      inboxIdentitiesService.getAllIdentities().then(function(identities) {
        expect(identities).to.deep.equal([
          { id: 'default', isDefault: true },
          identity
        ]);

        done();
      });
      $rootScope.$digest();
    });

    it('should store only the signature of the default identity', function(done) {
      defaultIdentity.textSignature = 'signature';

      inboxIdentitiesService.storeIdentity(defaultIdentity);
      $httpBackend.flush();

      expect(esnUserConfigurationService.set).to.have.been.calledWith([
        {
          name: 'identities.default',
          value: {
            textSignature: 'signature'
          }
        }
      ], 'linagora.esn.unifiedinbox');

      inboxIdentitiesService.getAllIdentities().then(function(identities) {
        expect(identities).to.deep.equal([
          { id: 'default', isDefault: true, textSignature: 'signature' }
        ]);

        done();
      });
      $rootScope.$digest();
    });

  });

  describe('The getIdentity function', function() {

    it('should find an identity by ID', function(done) {
      inboxIdentitiesService.getIdentity('default').then(function(identity) {
        expect(identity).to.deep.equal(defaultIdentity);

        done();
      });
      $httpBackend.flush();
    });

    it('should return nothing if the identity is not found', function(done) {
      inboxIdentitiesService.getIdentity('unknownIdentity').then(function(identity) {
        expect(identity).to.equal(undefined);

        done();
      });
      $httpBackend.flush();
    });

  });

  describe('The getAllIdentities function', function() {

    it('should return only the default identity if there is no custom identities', function(done) {
      inboxIdentitiesService.getAllIdentities().then(function(identities) {
        expect(identities).to.deep.equal([defaultIdentity]);

        done();
      });
      $httpBackend.flush();
    });

    it('should return all identities, starting by the default one', function(done) {
      config['linagora.esn.unifiedinbox.identities'] = [
        { id: 'customIdentitiy1' },
        { id: 'customIdentitiy2' }
      ];

      inboxIdentitiesService.getAllIdentities().then(function(identities) {
        expect(identities).to.deep.equal([
          defaultIdentity,
          { id: 'customIdentitiy1' },
          { id: 'customIdentitiy2' }
        ]);

        done();
      });
      $httpBackend.flush();
    });

    it('should cache identities', function(done) {
      config['linagora.esn.unifiedinbox.identities'] = [
        { id: 'customIdentitiy1' }
      ];

      inboxIdentitiesService.getAllIdentities();
      $httpBackend.flush();

      config['linagora.esn.unifiedinbox.identities'] = [];

      inboxIdentitiesService.getAllIdentities().then(function(identities) {
        expect(identities).to.deep.equal([
          defaultIdentity,
          { id: 'customIdentitiy1' }
        ]);

        done();
      });
      $rootScope.$digest();
    });

  });

});
