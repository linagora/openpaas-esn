'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The contact Angular module directives', function() {

  beforeEach(function() {
    angular.mock.module('ngRoute');
    angular.mock.module('esn.core');
    angular.mock.module('esn.websocket');
    angular.mock.module('esn.api-notification');
    angular.mock.module('linagora.esn.contact');
    angular.mock.module('esn.alphalist');
    angular.mock.module('esn.form.helper');
    angular.mock.module('esn.header');
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

    var element;

    beforeEach(function() {
      element = this.$compile('<contact-photo editable="true" contact="contact"></contact-photo>')(this.$scope);
    });

    it('should display the hint', function() {
      this.$scope.$digest();

      expect(element.find('i').css('display')).to.not.equal('none');
    });

  });


  describe('The relaxedDate directive', function() {

    var $compile, $rootScope, element, $scope, CONTACT_DATE_FORMAT;

    beforeEach(inject(function(_$compile_, _$rootScope_, _CONTACT_DATE_FORMAT_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      CONTACT_DATE_FORMAT = _CONTACT_DATE_FORMAT_;

      $scope = $rootScope.$new();
    }));

    beforeEach(function() {
      element = $compile('<form name="form"><input type="text" name="date" relaxed-date ng-model="date" /></form>')($scope);
    });

    it('should define the placeholder on the element', function() {
      expect(element.find('input').attr('placeholder')).to.equal(CONTACT_DATE_FORMAT);
    });

    it('should parse the value as a Date object', function() {
      $scope.form.date.$setViewValue('01/31/1970');
      $scope.$digest();

      expect($scope.date).to.equalDate(new Date(1970, 0, 31));
    });

    it('should allow any string value', function() {
      $scope.form.date.$setViewValue('I am not a date');
      $scope.$digest();

      expect($scope.date).to.equal('I am not a date');
    });

    it('should display a formatted date if the model contains a valid Date', function() {
      $scope.date = new Date(2015, 0, 15);
      $scope.$digest();

      expect($scope.form.date.$viewValue).to.equal('01/15/2015');
    });

    it('should display any string value if model is not a Date', function() {
      $scope.date = 'I am still not a date';
      $scope.$digest();

      expect($scope.form.date.$viewValue).to.equal('I am still not a date');
    });
  });

  describe('The contactListToggle directive', function() {

    var $compile, $rootScope, element, $scope, toggleContactDisplayService, toggleContactDisplayServiceMock, CONTACT_LIST_DISPLAY, CONTACT_LIST_DISPLAY_EVENTS;

    beforeEach(function() {

      toggleContactDisplayServiceMock = {
        getCurrentDisplay: function() {},
        setCurrentDisplay: function(value) {}
      };

      module(function($provide) {
        $provide.value('toggleContactDisplayService', toggleContactDisplayServiceMock);
      });

      inject(function(_$compile_, _$rootScope_, _toggleContactDisplayService_, _CONTACT_LIST_DISPLAY_, _CONTACT_LIST_DISPLAY_EVENTS_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        toggleContactDisplayService = _toggleContactDisplayService_;
        CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
        CONTACT_LIST_DISPLAY_EVENTS = _CONTACT_LIST_DISPLAY_EVENTS_;
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
      toggleContactDisplayServiceMock.getCurrentDisplay = function() {
        return CONTACT_LIST_DISPLAY.list;
      };

      initDirective();
      $scope.$digest();
      expect($scope.toggleContactDisplay).to.be.false;
    });

    it('should have toggleContactDisplay to true when current display is CONTACT_LIST_DISPLAY.cards', function() {
      toggleContactDisplayServiceMock.getCurrentDisplay = function() {
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
        $rootScope.$emit(CONTACT_LIST_DISPLAY_EVENTS.toggle, CONTACT_LIST_DISPLAY.cards);
        expect($scope.toggleContactDisplay).to.be.true;
      });

      it('should update toggleContactDisplay when toggle event is for list display', function() {
        $scope.toggleContactDisplay = true;
        initDirective();
        $scope.$digest();
        $rootScope.$emit(CONTACT_LIST_DISPLAY_EVENTS.toggle, CONTACT_LIST_DISPLAY.list);
        expect($scope.toggleContactDisplay).to.be.false;
      });
    });

    describe('The updateDisplay function', function() {

      it('should save the card display when called with true', function(done) {
        toggleContactDisplayService.setCurrentDisplay = function(value) {
          expect(value).to.equal(CONTACT_LIST_DISPLAY.cards);
          done();
        };
        initDirective();
        $scope.$digest();
        $scope.updateDisplay(true);
      });

      it('should save the list display when called with true', function(done) {
        toggleContactDisplayService.setCurrentDisplay = function(value) {
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

    var $compile, $rootScope, element, $scope, toggleContactDisplayService, toggleContactDisplayServiceMock, CONTACT_LIST_DISPLAY, CONTACT_LIST_DISPLAY_EVENTS;

    beforeEach(function() {

      toggleContactDisplayServiceMock = {
        getCurrentDisplay: function() {
        },
        setCurrentDisplay: function(value) {
        }
      };

      module(function($provide) {
        $provide.value('toggleContactDisplayService', toggleContactDisplayServiceMock);
      });

      inject(function(_$compile_, _$rootScope_, _toggleContactDisplayService_, _CONTACT_LIST_DISPLAY_, _CONTACT_LIST_DISPLAY_EVENTS_) {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        toggleContactDisplayService = _toggleContactDisplayService_;
        CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
        CONTACT_LIST_DISPLAY_EVENTS = _CONTACT_LIST_DISPLAY_EVENTS_;
        $scope = $rootScope.$new();
      });
    });

    var initDirective = function() {
      return $compile('<contact-list-displayer></contact-list-displayer>')($scope);
    };

    it('should set displayAs with the toggleContactDisplayService value', function() {
      var value = 'the value';
      toggleContactDisplayServiceMock.getCurrentDisplay = function() {
        return value;
      };
      element = initDirective();
      $scope.$digest();
      expect($scope.displayAs).to.equal(value);
    });

    it('should set displayAs with the CONTACT_LIST_DISPLAY_EVENTS.toggle $rootScope event value', function() {
      var value = 'the value';
      element = initDirective();
      $scope.$digest();
      $rootScope.$emit(CONTACT_LIST_DISPLAY_EVENTS.toggle, value);
      expect($scope.displayAs).to.equal(value);
    });

    it('should save the current value when changing location', function(done) {
      var value = 'my value';
      toggleContactDisplayServiceMock.setCurrentDisplay = function(display) {
        expect(display).to.equal(value);
        done();
      };
      toggleContactDisplayService.getCurrentDisplay = function() {
        return value;
      };
      element = initDirective();
      $scope.$digest();
      $scope.$emit('$locationChangeStart');
    });
  });


  describe('The contactDisplay directive', function() {
    var $compile, $rootScope, element, $scope;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $scope = $rootScope.$new();
      $scope.contact = {
        emails: [],
        tel: [],
        addresses: [],
        social: [],
        urls: []
      };
      element = $compile('<contact-display contact="contact"></contact-display>')($scope);
      $scope.$digest();
    }));

    describe('The hasContactInformation fn', function() {

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

  });

});
