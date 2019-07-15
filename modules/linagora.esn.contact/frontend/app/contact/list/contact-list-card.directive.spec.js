'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contactListCard directive', function() {
  var $compile, $rootScope, $scope;
  var contactAddressbookDisplayService, CONTACT_AVATAR_SIZE;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');
    module('jadeTemplates');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _contactAddressbookDisplayService_, _CONTACT_AVATAR_SIZE_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    contactAddressbookDisplayService = _contactAddressbookDisplayService_;
    CONTACT_AVATAR_SIZE = _CONTACT_AVATAR_SIZE_;
    $scope = $rootScope.$new();
    $scope.contact = {
      emails: [],
      tel: [],
      addresses: [],
      social: [],
      urls: []
    };
    contactAddressbookDisplayService.convertShellToDisplayShell = angular.noop;
  }));

  function initDirective() {
    var element = $compile('<contact-list-card contact="contact" book-id="bookId"></contact-list-card>')($scope);
    $scope.$digest();
    return element;
  }

  it('should have cards size for contact avatar', function() {
    expect(initDirective().isolateScope().avatarSize).to.equal(CONTACT_AVATAR_SIZE.cards);
  });

  it('should display phone', function() {
    var phone = '+33333333';
    $scope.contact.tel = [{type: 'work', value: phone}];
    var element = initDirective();
    expect(element).to.contain(phone);
  });

  it('should display work phone if N phones are set', function() {
    var phone = '+33333333';
    $scope.contact.tel = [{type: 'home', value: 'homephone'}, {type: 'work', value: phone}];
    var element = initDirective();
    expect(element).to.contain(phone);
  });

  it('should display email', function() {
    var email = 'me@work.com';
    $scope.contact.emails = [{type: 'work', value: email}];
    var element = initDirective();
    expect(element).to.contain(email);
  });

  it('should display work email if N emails are set', function() {
    var email = 'me@work.com';
    $scope.contact.emails = [{type: 'home', value: 'me@home'}, {type: 'work', value: email}];
    var element = initDirective();
    expect(element).to.contain(email);
  });

  it('should allow to click anywhere to view contact', function() {
    var element = initDirective();

    var isoScope = element.isolateScope();
    isoScope.displayContact = sinon.spy();

    element.find('.card-body').first().click();
    expect(isoScope.displayContact.callCount).to.equal(1);

    element.find('.card-image').first().click();
    expect(isoScope.displayContact.callCount).to.equal(2);
  });

  it('should not display contact when click on email', function() {
    $scope.contact.emails = [{ type: 'home', value: 'me@home' }];
    var element = initDirective();

    var isoScope = element.isolateScope();
    isoScope.displayContact = sinon.spy();

    element.find('a[ng-href="mailto:me@home"]').click();
    expect(isoScope.displayContact.called).to.be.false;
  });

  it('should not display contact when click on phone', function() {
    $scope.contact.tel = [{ type: 'home', value: '123' }];
    var element = initDirective();

    var isoScope = element.isolateScope();
    isoScope.displayContact = sinon.spy();

    element.find('a[ng-href="tel:123"]').click();
    expect(isoScope.displayContact.called).to.be.false;
  });
});
