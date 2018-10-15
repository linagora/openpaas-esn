'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The VirtualAddressBookConfiguration service', function() {
  var $rootScope, $q, VirtualAddressBookConfiguration, VirtualAddressBookRegistry, esnConfig;

  beforeEach(function() {
    esnConfig = sinon.stub();
    VirtualAddressBookRegistry = {
      get: sinon.stub()
    };

    module('linagora.esn.contact', function($provide) {
      $provide.value('esnConfig', esnConfig);
      $provide.value('VirtualAddressBookRegistry', VirtualAddressBookRegistry);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$q_, _VirtualAddressBookConfiguration_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    VirtualAddressBookConfiguration = _VirtualAddressBookConfiguration_;
  }));

  describe('The isEnabled service', function() {
    it('should reject if addressbook does not exists', function(done) {
      var id = 'doesnotexists';

      VirtualAddressBookRegistry.get.returns($q.when());

      VirtualAddressBookConfiguration.isEnabled(id).then(function() {
        done(new Error('Should not occur'));
      }).catch(function(err) {
        expect(VirtualAddressBookRegistry.get).to.has.been.calledWith(id);
        expect(err.message).to.match(/is not a valid addressbook/);
        done();
      });

      $rootScope.$digest();
    });

    it('should resolve with the module configuration value', function(done) {
      var id = 'exists';
      var value = 'the config value';
      var addressbook = {id: id, options: {configuration: {enabled: 'the enabled property'}}};

      VirtualAddressBookRegistry.get.returns($q.when(addressbook));
      esnConfig.returns($q.when(value));

      VirtualAddressBookConfiguration.isEnabled(id).then(function(enabled) {
        expect(VirtualAddressBookRegistry.get).to.has.been.calledWith(id);
        expect(esnConfig).to.has.been.calledWith(addressbook.options.configuration.enabled);
        expect(enabled).to.equal(value);

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });
});
