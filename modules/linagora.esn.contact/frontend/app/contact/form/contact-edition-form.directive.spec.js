'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contactEditionForm directive', function() {
  var $q, $compile, $rootScope, $scope;
  var CONTACT_AVATAR_SIZE, DEFAULT_ADDRESSBOOK_NAME, CONTACT_COLLECTED_ADDRESSBOOK_NAME;
  var contactAddressbookService;

  beforeEach(function() {
    module('esn.core');
    module('linagora.esn.contact');
    module('jadeTemplates');
  });

  beforeEach(inject(function(
    _$q_,
    _$compile_,
    _$rootScope_,
    _contactAddressbookService_,
    _CONTACT_AVATAR_SIZE_,
    _DEFAULT_ADDRESSBOOK_NAME_,
    _CONTACT_COLLECTED_ADDRESSBOOK_NAME_
  ) {
    contactAddressbookService = _contactAddressbookService_;
    $q = _$q_;
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    CONTACT_AVATAR_SIZE = _CONTACT_AVATAR_SIZE_;
    DEFAULT_ADDRESSBOOK_NAME = _DEFAULT_ADDRESSBOOK_NAME_;
    CONTACT_COLLECTED_ADDRESSBOOK_NAME = _CONTACT_COLLECTED_ADDRESSBOOK_NAME_;
    $scope = $rootScope.$new();
    $scope.contact = {
      emails: [],
      tel: [],
      addresses: [],
      social: [],
      urls: []
    };
    contactAddressbookService.listAddressbooksUserCanCreateContact = function() {
      return $q.when([{
        bookName: DEFAULT_ADDRESSBOOK_NAME
      }, {
        bookName: CONTACT_COLLECTED_ADDRESSBOOK_NAME
      }]);
    };
  }));

  function initDirective(scope) {
    var element = $compile('<contact-edition-form contact="contact" book-name="bookName" contact-state="new"></contact-edition-form>')(scope);

    scope.$digest();

    return element;
  }

  it('should have bigger size for contact avatar', function() {
    var element = initDirective($scope);

    expect(element.isolateScope().avatarSize).to.equal(CONTACT_AVATAR_SIZE.bigger);
  });

  it('should only show address book select box when create new contact', function() {
    var createElement = $compile('<contact-edition-form contact="contact" book-name="bookName" contact-state="new"></contact-edition-form>')($scope);

    $scope.$digest();

    expect(createElement.find('.contact-addressbook-selector').hasClass('ng-hide')).to.be.false;

    var editElement = $compile('<contact-edition-form contact="contact" book-name="bookName"></contact-edition-form>')($scope);

    $scope.$digest();

    expect(editElement.find('.contact-addressbook-selector').hasClass('ng-hide')).to.be.true;
  });

  it('should preselect Address Book according to current address book', function() {
    $scope.bookName = CONTACT_COLLECTED_ADDRESSBOOK_NAME;

    var element = initDirective($scope);

    expect(element.find('[ng-model="bookName"]').val()).to.equal(CONTACT_COLLECTED_ADDRESSBOOK_NAME);
  });
});
