'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The ContactVirtualAddressBookService service', function() {
  var $rootScope, $q, ContactVirtualAddressBookService, ContactVirtualAddressBookConfiguration, ContactVirtualAddressBookRegistry, esnConfig;

  beforeEach(function() {
    esnConfig = sinon.stub();
    ContactVirtualAddressBookRegistry = {
      get: sinon.stub(),
      list: sinon.stub()
    };
    ContactVirtualAddressBookConfiguration = {
      isEnabled: sinon.stub()
    };

    module('linagora.esn.contact', function($provide) {
      $provide.value('esnConfig', esnConfig);
      $provide.value('ContactVirtualAddressBookRegistry', ContactVirtualAddressBookRegistry);
      $provide.value('ContactVirtualAddressBookConfiguration', ContactVirtualAddressBookConfiguration);
    });
  });

  beforeEach(inject(function(_$rootScope_, _$q_, _ContactVirtualAddressBookService_) {
    $rootScope = _$rootScope_;
    $q = _$q_;
    ContactVirtualAddressBookService = _ContactVirtualAddressBookService_;
  }));

  describe('The list function', function() {
    it('should load all enabled addressbooks number of contacts then resolve', function(done) {
      var addressbooks = [
        {
          id: 1,
          loadContactsCount: sinon.stub().returns($q.when())
        },
        {
          id: 2,
          loadContactsCount: sinon.stub().returns($q.when())
        },
        {
          id: 3,
          loadContactsCount: sinon.stub().returns($q.reject(new Error('should not be called')))
        }
      ];

      ContactVirtualAddressBookRegistry.list.returns($q.when(addressbooks));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(1).returns($q.when(true));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(2).returns($q.when(true));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(3).returns($q.when(false));
      ContactVirtualAddressBookService.list().then(function(result) {
        expect(result.length).to.eq(2);
        expect(addressbooks[0].loadContactsCount).to.have.been.called;
        expect(addressbooks[1].loadContactsCount).to.have.been.called;
        expect(addressbooks[2].loadContactsCount).to.not.have.been.called;
        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should return all the addressbooks which are enabled from configuration', function(done) {
      var addressbooks = [
        {
          id: 1,
          loadContactsCount: angular.noop
        },
        {
          id: 2,
          loadContactsCount: angular.noop
        },
        {
          id: 3,
          loadContactsCount: angular.noop
        }
      ];

      ContactVirtualAddressBookRegistry.list.returns($q.when(addressbooks));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(1).returns($q.when(true));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(2).returns($q.when(false));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(3).returns($q.when(true));

      ContactVirtualAddressBookService.list().then(function(result) {
        expect(result.length).to.eq(2);
        expect(result).to.shallowDeepEqual([{ id: 1 }, { id: 3 }]);
        done();
      }).catch(done);

      $rootScope.$digest();
    });

    it('should not include an addressbook which rejects from configuration', function(done) {
      var addressbooks = [
        {
          id: 1,
          loadContactsCount: angular.noop
        },
        {
          id: 2,
          loadContactsCount: angular.noop
        },
        {
          id: 3,
          loadContactsCount: angular.noop
        }
      ];

      ContactVirtualAddressBookRegistry.list.returns($q.when(addressbooks));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(1).returns($q.reject(new Error()));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(2).returns($q.when(false));
      ContactVirtualAddressBookConfiguration.isEnabled.withArgs(3).returns($q.when(true));

      ContactVirtualAddressBookService.list().then(function(result) {
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

      ContactVirtualAddressBookRegistry.get.returns($q.when());

      ContactVirtualAddressBookService.get(addressbook.id).then(done).catch(function(error) {
        expect(ContactVirtualAddressBookRegistry.get).to.have.been.calledWith(addressbook.id);
        expect(error.message).to.match(/No such virtual addressbook/);

        done();
      });

      $rootScope.$digest();
    });

    it('should reject when addressbook is not enabled', function(done) {
      var addressbook = { id: 1 };

      ContactVirtualAddressBookRegistry.get.returns($q.when(addressbook));
      ContactVirtualAddressBookConfiguration.isEnabled.returns($q.when(false));

      ContactVirtualAddressBookService.get(addressbook.id).then(done).catch(function(error) {
        expect(ContactVirtualAddressBookRegistry.get).to.have.been.calledWith(addressbook.id);
        expect(ContactVirtualAddressBookConfiguration.isEnabled).to.have.been.calledWith(addressbook.id);
        expect(error.message).to.match(/has been disabled/);

        done();
      });

      $rootScope.$digest();
    });

    it('should load addressbook number of contact then resolve', function(done) {
      var addressbook = {
        id: 1,
        loadContactsCount: sinon.stub().returns($q.when())
      };

      ContactVirtualAddressBookRegistry.get.returns($q.when(addressbook));
      ContactVirtualAddressBookConfiguration.isEnabled.returns($q.when(true));

      ContactVirtualAddressBookService.get(addressbook.id).then(function(result) {
        expect(addressbook.loadContactsCount).to.have.been.called;
        expect(ContactVirtualAddressBookRegistry.get).to.have.been.calledWith(addressbook.id);
        expect(ContactVirtualAddressBookConfiguration.isEnabled).to.have.been.calledWith(addressbook.id);
        expect(result).to.equal(addressbook);

        done();
      }).catch(done);

      $rootScope.$digest();
    });
  });
});
