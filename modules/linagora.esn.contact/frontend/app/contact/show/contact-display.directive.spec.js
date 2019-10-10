'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactDisplay directive', function() {
  var $compile, $state, $rootScope, element, $scope, CONTACT_AVATAR_SIZE, ContactShellDisplayBuilder, esnI18nService, contactAddressbookDisplayService;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');
    module('jadeTemplates');
  });

  beforeEach(function() {
    ContactShellDisplayBuilder = {
      build: function() {}
    };

    esnI18nService = {
      translate: sinon.spy(function(input) {
        return {
          toString: function() {return input;}
        };
      })
    };

    module(function($provide) {
      $provide.value('ContactShellDisplayBuilder', ContactShellDisplayBuilder);
      $provide.value('esnI18nService', esnI18nService);
    });
  });

  beforeEach(inject(function(_$q_, _$compile_, _$rootScope_, _CONTACT_AVATAR_SIZE_, _$state_, _contactAddressbookDisplayService_) {
    $compile = _$compile_;
    $state = _$state_;
    $rootScope = _$rootScope_;
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    CONTACT_AVATAR_SIZE = _CONTACT_AVATAR_SIZE_;
    $scope = $rootScope.$new();
    $scope.contact = {
      emails: [],
      tel: [],
      addresses: [],
      social: [],
      urls: [],
      addressbook: {}
    };
    contactAddressbookDisplayService.convertShellToDisplayShell = angular.noop;
  }));

  var initDirective = function() {
    element = $compile('<contact-display contact="contact"></contact-display>')($scope);
    $scope.$digest();
  };

  it('should have bigger size for contact avatar', function() {
    initDirective();
    expect(element.isolateScope().avatarSize).to.equal(CONTACT_AVATAR_SIZE.bigger);
  });

  it('should set the displayShell in the scope', function() {
    var display = {foo: 'bar'};
    ContactShellDisplayBuilder.build = function() {
      return display;
    };
    initDirective();
    expect(element.isolateScope().displayShell).to.equal(display);
  });

  describe('The hasContactInformation fn', function() {

    beforeEach(initDirective);

    it('should return falsy value if there is no contact contact informations', function() {
      var scope = element.isolateScope();
      expect(scope.hasContactInformation()).to.not.be.ok;
    });

    it('should return truthy value if there are some contact informations', function() {
      var scope = element.isolateScope();

      scope.contact = { emails: ['mail@example.com'] };
      expect(scope.hasContactInformation()).to.be.ok;

      scope.contact = { tel: ['123'] };
      expect(scope.hasContactInformation()).to.be.ok;

      scope.contact = { addresses: ['Some place'] };
      expect(scope.hasContactInformation()).to.be.ok;

      scope.contact = { social: ['some IM'] };
      expect(scope.hasContactInformation()).to.be.ok;

      scope.contact = { urls: ['some websites'] };
      expect(scope.hasContactInformation()).to.be.ok;
    });

  });

  describe('The hasProfileInformation fn', function() {

    beforeEach(initDirective);

    it('should return falsy value if there is no contact profile informations', function() {
      var scope = element.isolateScope();
      expect(scope.hasProfileInformation()).to.not.be.ok;
    });

    it('should return truthy value if there are some profile informations', function() {
      var scope = element.isolateScope();

      scope.contact = { firstName: 'Alice' };
      expect(scope.hasProfileInformation()).to.be.ok;

      scope.contact = { lastName: 'Bob' };
      expect(scope.hasProfileInformation()).to.be.ok;

      scope.contact = { nickname: 'alicebob' };
      expect(scope.hasProfileInformation()).to.be.ok;

      scope.formattedBirthday = 'abcd';
      expect(scope.hasProfileInformation()).to.be.ok;
    });
  });

  describe('The shouldDisplayWork fn', function() {

    beforeEach(initDirective);

    it('should return falsy value if there is no work information', function() {
      var scope = element.isolateScope();
      expect(scope.shouldDisplayWork()).to.not.be.ok;
    });

    it('should return truthy value if there are some work information', function() {
      var scope = element.isolateScope();

      scope.contact = { orgName: 'Linagora' };
      expect(scope.shouldDisplayWork()).to.be.ok;

      scope.contact = { orgRole: 'Dev' };
      expect(scope.shouldDisplayWork()).to.be.ok;

      scope.contact = { orgName: 'Linagora', orgRole: 'Dev' };
      expect(scope.shouldDisplayWork()).to.be.ok;
    });
  });

  describe('The openAddressbook fn', function() {

    beforeEach(initDirective);

    it('should open address book that the current contact belong to', function() {
      var scope = element.isolateScope();

      scope.contact.addressbook = {
        bookId: 'bookId',
        bookName: 'contacts'
      };

      $state.go = sinon.spy();
      scope.openAddressbook();
      expect($state.go).to.have.been.calledWith('contact.addressbooks', {
        bookId: $scope.contact.addressbook.bookId,
        bookName: $scope.contact.addressbook.bookName
      });
    });
  });
});
