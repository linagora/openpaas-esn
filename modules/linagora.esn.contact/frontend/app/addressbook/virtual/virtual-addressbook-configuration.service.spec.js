'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ContactVirtualAddressBookConfiguration service', function() {
  var $rootScope, $q, ContactVirtualAddressBookConfiguration, ContactVirtualAddressBookRegistry, esnConfig;

  beforeEach(function() {
    esnConfig = sinon.stub();
    ContactVirtualAddressBookRegistry = {
      get: sinon.stub()
    };

    module('linagora.esn.contact', function($provide) {
      $provide.value('esnConfig', esnConfig);
      $provide.value('ContactVirtualAddressBookRegistry', ContactVirtualAddressBookRegistry);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$q_, _ContactVirtualAddressBookConfiguration_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    ContactVirtualAddressBookConfiguration = _ContactVirtualAddressBookConfiguration_;
  }));

  describe('The isEnabled service', function() {
    it('should reject if addressbook does not exists', function(done) {
      var id = 'doesnotexists';

      ContactVirtualAddressBookRegistry.get.returns($q.when());

      ContactVirtualAddressBookConfiguration.isEnabled(id).then(function() {
        done(new Error('Should not occur'));
      }).catch(function(err) {
        expect(ContactVirtualAddressBookRegistry.get).to.has.been.calledWith(id);
        expect(err.message).to.match(/is not a valid addressbook/);
        done();
      });

      $rootScope.$digest();
    });

    it('should resolve with the module configuration value', function(done) {
      var id = 'exists';
      var value = 'the config value';
      var addressbook = {id: id, options: {configuration: {enabled: 'the enabled property'}}};

      ContactVirtualAddressBookRegistry.get.returns($q.when(addressbook));
      esnConfig.returns($q.when(value));

      ContactVirtualAddressBookConfiguration.isEnabled(id).then(function(enabled) {
        expect(ContactVirtualAddressBookRegistry.get).to.has.been.calledWith(id);
        expect(esnConfig).to.has.been.calledWith(addressbook.options.configuration.enabled);
        expect(enabled).to.equal(value);

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });
});
