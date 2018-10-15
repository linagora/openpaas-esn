'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The VirtualAddressBookService service', function() {
  var $rootScope, $q, VirtualAddressBookService, VirtualAddressBookConfiguration, VirtualAddressBookRegistry, esnConfig;

  beforeEach(function() {
    esnConfig = sinon.stub();
    VirtualAddressBookRegistry = {
      get: sinon.stub(),
      list: sinon.stub()
    };
    VirtualAddressBookConfiguration = {
      isEnabled: sinon.stub()
    };

    module('linagora.esn.contact', function($provide) {
      $provide.value('esnConfig', esnConfig);
      $provide.value('VirtualAddressBookRegistry', VirtualAddressBookRegistry);
      $provide.value('VirtualAddressBookConfiguration', VirtualAddressBookConfiguration);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$q_, _VirtualAddressBookService_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    VirtualAddressBookService = _VirtualAddressBookService_;
  }));

  describe('The list function', function() {
    it('should return all the addressbooks which are enabled from configuration', function(done) {
      var addressbooks = [
        {
          id: 1
        },
        {
          id: 2
        },
        {
          id: 3
        }
      ];

      VirtualAddressBookRegistry.list.returns($q.when(addressbooks));
      VirtualAddressBookConfiguration.isEnabled.withArgs(1).returns($q.when(true));
      VirtualAddressBookConfiguration.isEnabled.withArgs(2).returns($q.when(false));
      VirtualAddressBookConfiguration.isEnabled.withArgs(3).returns($q.when(true));

      VirtualAddressBookService.list().then(function(result) {
        expect(result.length).to.eq(2);
        expect(result).to.shallowDeepEqual([{ id: 1 }, { id: 3 }]);
        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should does not include an addressbook which rejects from configuration', function(done) {
      var addressbooks = [
        {
          id: 1
        },
        {
          id: 2
        },
        {
          id: 3
        }
      ];

      VirtualAddressBookRegistry.list.returns($q.when(addressbooks));
      VirtualAddressBookConfiguration.isEnabled.withArgs(1).returns($q.reject(new Error()));
      VirtualAddressBookConfiguration.isEnabled.withArgs(2).returns($q.when(false));
      VirtualAddressBookConfiguration.isEnabled.withArgs(3).returns($q.when(true));

      VirtualAddressBookService.list().then(function(result) {
        expect(result.length).to.eq(1);
        expect(result).to.shallowDeepEqual([{ id: 3 }]);
        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });

  describe('The get function', function() {
    it('should reject when addressbook is not found', function(done) {
      var addressbook = { id: 1 };

      VirtualAddressBookRegistry.get.returns($q.when());

      VirtualAddressBookService.get(addressbook.id).then(done).catch(function(error) {
        expect(VirtualAddressBookRegistry.get).to.have.been.calledWith(addressbook.id);
        expect(error.message).to.match(/No such virtual addressbook/);

        done();
      });

      $rootScope.$digest();
    });

    it('should reject when addressbook is not enabled', function(done) {
      var addressbook = { id: 1 };

      VirtualAddressBookRegistry.get.returns($q.when(addressbook));
      VirtualAddressBookConfiguration.isEnabled.returns($q.when(false));

      VirtualAddressBookService.get(addressbook.id).then(done).catch(function(error) {
        expect(VirtualAddressBookRegistry.get).to.have.been.calledWith(addressbook.id);
        expect(VirtualAddressBookConfiguration.isEnabled).to.have.been.calledWith(addressbook.id);
        expect(error.message).to.match(/has been disabled/);

        done();
      });

      $rootScope.$digest();
    });

    it('should resolve with addressbook', function(done) {
      var addressbook = { id: 1 };

      VirtualAddressBookRegistry.get.returns($q.when(addressbook));
      VirtualAddressBookConfiguration.isEnabled.returns($q.when(true));

      VirtualAddressBookService.get(addressbook.id).then(function(result) {
        expect(VirtualAddressBookRegistry.get).to.have.been.calledWith(addressbook.id);
        expect(VirtualAddressBookConfiguration.isEnabled).to.have.been.calledWith(addressbook.id);
        expect(result).to.equal(addressbook);

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });
});
