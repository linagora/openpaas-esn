'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The contact Angular module directives', function() {
  var contactAddressbookDisplayService;

  beforeEach(function() {
    module('esn.core');
    module('esn.websocket');
    module('esn.api-notification');
    module('linagora.esn.contact');
    module('esn.alphalist');
    module('esn.form.helper');
    module('esn.header');
    module('jadeTemplates');
  });

  describe('The contactPhoto directive', function() {

    var element;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
      this.$compile = _$compile_;
      this.DEFAULT_AVATAR = '/contact/images/default_avatar.png';
    }));

    beforeEach(function() {
      this.$scope.contact = {};
      element = this.$compile('<contact-photo contact="contact"></contact-photo>')(this.$scope);
    });

    it('should use the default avatar if contact.photo is not defined', function() {
      this.$scope.$digest();

      expect(element.find('img').attr('src')).to.equal(this.DEFAULT_AVATAR);
    });

    it('should use the contact photo if defined', function() {
      this.$scope.contact = {
        photo: 'data:image/png,base64;abcd='
      };
      this.$scope.$digest();

      expect(element.find('img').attr('src')).to.equal('data:image/png,base64;abcd=');
    });

  });

  describe('The editable contactPhoto directive', function() {

    var element, $scope;

    beforeEach(inject(function($compile, $rootScope) {
      $scope = $rootScope.$new();
      $scope.contact = {};

      element = $compile('<contact-photo editable="true" contact="contact"></contact-photo>')($scope);
    }));

    it('should display the hint', function() {
      $scope.$digest();

      expect(element.find('i').css('display')).to.not.equal('none');
    });

  });

  describe('The relaxedDateForBsDatepicker directive', function() {

    var $compile, $rootScope, element, $scope, CONTACT_DATE_FORMAT, $browser;

    beforeEach(inject(function(_$compile_, _$rootScope_, _CONTACT_DATE_FORMAT_, _$browser_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      CONTACT_DATE_FORMAT = _CONTACT_DATE_FORMAT_;
      $browser = _$browser_;
      $scope = $rootScope.$new();
    }));

    beforeEach(function() {
      element = $compile('<form name="form"><input type="text" name="date" relaxed-date-for-bs-datepicker ng-model="date" /></form>')($scope);
      $scope.contact = { birthday: 'not a birthday' };
      $browser.defer.flush();
    });

    it('should define the placeholder on the element', function() {
      expect(element.find('input').attr('placeholder')).to.equal(CONTACT_DATE_FORMAT);
    });

    it('should allow any string value', function() {
      $scope.form.date.$setViewValue('I am not a date');
      $scope.$digest();

      expect($scope.date).to.equal('I am not a date');
    });

    it('should display any string value if model is not a Date', function() {
      $scope.date = 'I am still not a date';
      $scope.$digest();

      expect($scope.form.date.$viewValue).to.equal('I am still not a date');
    });
  });

  describe('The contactListToggle directive', function() {

    var $compile, $rootScope, element, $scope, ContactListToggleDisplayService, ContactListToggleEventService, ContactListToggleDisplayServiceMock, CONTACT_LIST_DISPLAY;

    beforeEach(function() {

      ContactListToggleDisplayServiceMock = {
        getCurrentDisplay: function() {},
        setCurrentDisplay: function() {}
      };

      module(function($provide) {
        $provide.value('ContactListToggleDisplayService', ContactListToggleDisplayServiceMock);
      });

      inject(function(_$compile_, _$rootScope_, _ContactListToggleDisplayService_, _ContactListToggleEventService_, _CONTACT_LIST_DISPLAY_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        ContactListToggleDisplayService = _ContactListToggleDisplayService_;
        ContactListToggleEventService = _ContactListToggleEventService_;
        CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
        $scope = $rootScope.$new();
        $scope.displayAs = CONTACT_LIST_DISPLAY.list;
      });
    });

    var initDirective = function() {
      return $compile('<contact-list-toggle></contact-list-toggle>')($scope);
    };

    it('should highlight list text list at start', function() {
      element = initDirective();
      $scope.$digest();
      expect(element.find('.list-item')).to.have.class('toggle-active');
      expect(element.find('.card-item')).to.not.have.class('toggle-active');
    });

    it('should highlight card text when clicking on toggle button', function() {
      element = initDirective();
      $scope.$digest();
      element.find('.ts-helper').click();
      expect(element.find('.list-item')).to.not.have.class('toggle-active');
      expect(element.find('.card-item')).to.have.class('toggle-active');
    });

    it('should switch back to initial state when clicking on toggle 2 times', function() {
      element = initDirective();
      $scope.$digest();
      element.find('.ts-helper').click();
      element.find('.ts-helper').click();
      expect(element.find('.list-item')).to.have.class('toggle-active');
      expect(element.find('.card-item')).to.not.have.class('toggle-active');
    });

    it('should have toggleContactDisplay to false when current display is CONTACT_LIST_DISPLAY.list', function() {
      ContactListToggleDisplayServiceMock.getCurrentDisplay = function() {
        return CONTACT_LIST_DISPLAY.list;
      };

      initDirective();
      $scope.$digest();
      expect($scope.toggleContactDisplay).to.be.false;
    });

    it('should have toggleContactDisplay to true when current display is CONTACT_LIST_DISPLAY.cards', function() {
      ContactListToggleDisplayServiceMock.getCurrentDisplay = function() {
        return CONTACT_LIST_DISPLAY.cards;
      };

      initDirective();
      $scope.$digest();
      expect($scope.toggleContactDisplay).to.be.true;
    });

    describe('The toggle event listener', function() {

      it('should not update toggleContactDisplay when toggle event is for card display', function() {
        $scope.toggleContactDisplay = true;
        initDirective();
        $scope.$digest();
        ContactListToggleEventService.broadcast(CONTACT_LIST_DISPLAY.cards);
        expect($scope.toggleContactDisplay).to.be.true;
      });

      it('should update toggleContactDisplay when toggle event is for list display', function() {
        $scope.toggleContactDisplay = true;
        initDirective();
        $scope.$digest();
        ContactListToggleEventService.broadcast(CONTACT_LIST_DISPLAY.list);
        expect($scope.toggleContactDisplay).to.be.false;
      });
    });

    describe('The updateDisplay function', function() {

      it('should save the card display when called with true', function(done) {
        ContactListToggleDisplayService.setCurrentDisplay = function(value) {
          expect(value).to.equal(CONTACT_LIST_DISPLAY.cards);
          done();
        };
        initDirective();
        $scope.$digest();
        $scope.updateDisplay(true);
      });

      it('should save the list display when called with true', function(done) {
        ContactListToggleDisplayService.setCurrentDisplay = function(value) {
          expect(value).to.equal(CONTACT_LIST_DISPLAY.list);
          done();
        };
        initDirective();
        $scope.$digest();
        $scope.updateDisplay(false);
      });
    });
  });

  describe('The contactListDisplayer directive', function() {

    var $rootScope, $compile, $scope, ContactListToggleDisplayService, ContactListToggleEventService, ContactListToggleDisplayServiceMock;

    beforeEach(function() {

      ContactListToggleDisplayServiceMock = {
        getCurrentDisplay: function() {
        },
        setCurrentDisplay: function() {
        }
      };

      module(function($provide) {
        $provide.value('ContactListToggleDisplayService', ContactListToggleDisplayServiceMock);
      });

      inject(function(_$rootScope_, _$compile_, _ContactListToggleDisplayService_, _ContactListToggleEventService_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        ContactListToggleDisplayService = _ContactListToggleDisplayService_;
        ContactListToggleEventService = _ContactListToggleEventService_;
        $scope = $rootScope.$new();
      });
    });

    function initDirective() {
      return $compile('<contact-list-displayer></contact-list-displayer>')($scope);
    }

    it('should set displayAs with the ContactListToggleDisplayService value', function() {
      var value = 'the value';
      ContactListToggleDisplayServiceMock.getCurrentDisplay = function() {
        return value;
      };

      initDirective();
      $scope.$digest();

      expect($scope.displayAs).to.equal(value);
    });

    it('should set displayAs with the ContactListToggleEventService.broadcast event value', function() {
      var value = 'the value';

      initDirective();
      $scope.$digest();
      ContactListToggleEventService.broadcast(value);

      expect($scope.displayAs).to.equal(value);
    });

    it('should save the current value when changing location', function(done) {
      var value = 'my value';

      ContactListToggleDisplayServiceMock.setCurrentDisplay = function(display) {
        expect(display).to.equal(value);
        done();
      };
      ContactListToggleDisplayService.getCurrentDisplay = function() {
        return value;
      };
      initDirective();
      $scope.$digest();
      $scope.$emit('$locationChangeStart');
    });
  });

  describe('The contactDisplay directive', function() {
    var $compile, $state, $rootScope, element, $scope, CONTACT_AVATAR_SIZE, ContactShellDisplayBuilder, esnI18nService;

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
          bookName: 'contacts'
        };

        $state.go = sinon.spy();
        scope.openAddressbook();
        expect($state.go).to.have.been.calledWith('contact.addressbooks', { bookName: $scope.contact.addressbook.bookName });
      });
    });
  });

  describe('The contactEditionForm directive', function() {
    var $q, $compile, $rootScope, $scope;
    var CONTACT_AVATAR_SIZE, DEFAULT_ADDRESSBOOK_NAME, CONTACT_COLLECTED_ADDRESSBOOK_NAME;
    var contactAddressbookService;

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

  describe('The contactListCard directive', function() {
    var $compile, $rootScope, $scope, CONTACT_AVATAR_SIZE;

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

      element.find('.contact-list-card').first().click();
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

  describe('The contactListItem directive', function() {
    var $compile, $rootScope, $scope, CONTACT_AVATAR_SIZE;

    beforeEach(inject(function(_$compile_, _$rootScope_, _contactAddressbookDisplayService_, _CONTACT_AVATAR_SIZE_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      CONTACT_AVATAR_SIZE = _CONTACT_AVATAR_SIZE_;
      $scope = $rootScope.$new();
      $scope.contact = {
        emails: [],
        tel: [],
        addresses: [],
        social: [],
        urls: []
      };
      contactAddressbookDisplayService = _contactAddressbookDisplayService_;
      contactAddressbookDisplayService.convertShellToDisplayShell = angular.noop;
    }));

    function initDirective() {
      var element = $compile('<contact-list-item contact="contact" book-id="bookId"></contact-list-item>')($scope);
      $scope.$digest();
      return element;
    }

    it('should have list size for contact avatar', function() {
      expect(initDirective().isolateScope().avatarSize).to.equal(CONTACT_AVATAR_SIZE.list);
    });

    it('should set the displayShell in scope', function() {
      var element = initDirective();
      expect(element.isolateScope().displayShell).to.be.defined;
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
      $scope.contact.emails = [{type: 'home', value: 'm@home.com'}, {type: 'work', value: email}];
      var element = initDirective();
      expect(element).to.contain(email);
    });

    it('should allow to click anywhere to view contact', function() {
      var element = initDirective();

      var isoScope = element.isolateScope();
      isoScope.displayContact = sinon.spy();

      element.find('.contact-list-item').first().click();
      expect(isoScope.displayContact.callCount).to.equal(1);

      element.find('contact-photo').first().click();
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

    it('should translate the contactShell to displayShell', function() {
      var element = initDirective();
      var isoScope = element.isolateScope();
      expect(isoScope.displayShell.shell).to.deep.equal($scope.contact);
    });
  });

  describe('The contactListItems directive', function() {
    var $compile, $rootScope, $scope, CONTACT_EVENTS, $timeout, triggerScroll;
    var ContactListScrollingServiceMock, sharedContactDataServiceMock, categoryLetter, onScroll, unregister;

    beforeEach(function() {
      ContactListScrollingServiceMock = function(element, callback) {
        if (triggerScroll) {
          callback();
        }

        return {
          onScroll: onScroll,
          unregister: unregister
        };
      };

      module(function($provide) {
        $provide.value('ContactListScrollingService', ContactListScrollingServiceMock);
        $provide.value('sharedContactDataService', { categoryLetter: categoryLetter });
      });

      inject(function(_$compile_, _$rootScope_, _CONTACT_EVENTS_, _$timeout_, _sharedContactDataService_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        CONTACT_EVENTS = _CONTACT_EVENTS_;
        $timeout = _$timeout_;
        sharedContactDataServiceMock = _sharedContactDataService_;
      });

      $scope.headerDisplay = {
        letterExists: true
      };

    });

    function initDirective() {
      var element = $compile('<contact-list-items></contact-list-items>')($scope);
      $scope.$digest();
      return element;
    }

    it('should remove scroll listener when scope is destroyed', function(done) {
      unregister = done();
      initDirective();
      $scope.$destroy();
    });

    it('should init the headerDisplay letterExists to false', function() {
      initDirective();
      expect($scope.headerDisplay.letterExists).is.false;
    });

    it('should listen all contact event to update letter', function() {
      onScroll = sinon.spy();
      initDirective();
      angular.forEach(CONTACT_EVENTS, function(event) {
        $rootScope.$broadcast(event);
      });
      $timeout.flush();
      expect(onScroll.callCount).to.be.equal(Object.keys(CONTACT_EVENTS).length);
    });

    it('should update headerDisplay.mobileLetterVisibility when categoryLetter exists', function() {
      triggerScroll = true;
      sharedContactDataServiceMock.categoryLetter = 'A';
      initDirective();
      expect($scope.headerDisplay.mobileLetterVisibility).is.true;
      $timeout.flush();
      expect($scope.headerDisplay.mobileLetterVisibility).is.false;
    });

    it('should set headerDisplay.mobileLetterVisibility false when categoryLetter does not exists', function() {
      triggerScroll = true;
      sharedContactDataServiceMock.categoryLetter = '';
      initDirective();
      expect($scope.headerDisplay.mobileLetterVisibility).is.false;
    });
  });
});
