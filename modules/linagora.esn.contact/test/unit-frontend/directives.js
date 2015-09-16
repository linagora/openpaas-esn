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
    module('jadeTemplates');
  });

  describe('The contactPhoto directive', function() {

    var element;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
      this.$compile = _$compile_;
      this.DEFAULT_AVATAR = '/images/user.png';
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

    var $compile, $rootScope, element, $scope, CONTACT_LIST_DISPLAY;

    beforeEach(inject(function(_$compile_, _$rootScope_, _CONTACT_LIST_DISPLAY_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      CONTACT_LIST_DISPLAY = _CONTACT_LIST_DISPLAY_;
      $scope = $rootScope.$new();
      $scope.displayAs = CONTACT_LIST_DISPLAY.list;
    }));

    beforeEach(function() {
      element = $compile('<contact-list-toggle></contact-list-toggle>')($scope);
      $scope.$digest();
    });

    it('should have list button activated at start', function() {
      expect(element.find('.btn-contacts-list-toggle')).to.be.disabled;
      expect(element.find('.btn-contacts-cards-toggle')).to.be.enabled;
    });

    it('should switch buttons when clicking on cards one', function() {
      element.find('.btn-contacts-cards-toggle').click();
      expect(element.find('.btn-contacts-list-toggle')).to.be.enabled;
      expect(element.find('.btn-contacts-cards-toggle')).to.be.disabled;
    });

    it('should switch buttons back to intial state when clicking on cards then list', function() {
      element.find('.btn-contacts-cards-toggle').click();
      element.find('.btn-contacts-list-toggle').click();
      expect(element.find('.btn-contacts-list-toggle')).to.be.disabled;
      expect(element.find('.btn-contacts-cards-toggle')).to.be.enabled;
    });
  });
  describe('The multiInputGroupAddress directive', function() {

    var element;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
      this.$compile = _$compile_;
      this.initDirective = function(scope) {
        var html = '<multi-input-group-address multi-input-model="contact.addresses", multi-input-types="[]"></multi-input-group-address>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        this.eleScope = element.isolateScope();
        return element;
      };
    }));

    it('should load the existing content in inputs if there is', function() {
      this.initDirective(this.$scope);
      this.$scope.contact = {
        addresses: [
          {type: 'Home',
          street: 'Somewhere over the rainbow',
          zip: '777',
          city: 'Yolopolis',
          country: 'Yololand'},
          {type: 'Home',
          street: 'Somewhere else',
          zip: '666',
          city: 'Satantown',
          country: 'Hell'}
        ]
      };
      this.$scope.$digest();
      expect(this.eleScope.content.length).to.be.equal(2);
      expect(this.eleScope.showNextField).to.be.false;
    });
    it('should display a blank input if there is no existing content', function() {
      this.initDirective(this.$scope);
      this.$scope.contact = {
        addresses: []
      };
      this.$scope.$digest();
      expect(this.eleScope.content.length).to.be.equal(0);
      expect(this.eleScope.showNextField).to.be.true;
    });
    it('should display an "add a field button" when there is existing content', function() {
      this.initDirective(this.$scope);
      this.$scope.contact = {
        addresses: [
          {type: 'Home',
          street: 'Somewhere over the rainbow',
          zip: '777',
          city: 'Yolopolis',
          country: 'Yololand'},
          {type: 'Home',
          street: 'Somewhere else',
          zip: '666',
          city: 'Satantown',
          country: 'Hell'}
        ]
      };
      this.$scope.$digest();
      expect(this.eleScope.showAddButton).to.be.true;
    });
    it('should not display an "add a field button" when there is no existing content', function() {
      this.initDirective(this.$scope);
      this.$scope.contact = {
        addresses: []
      };
      this.$scope.$digest();
      expect(this.eleScope.showAddButton).to.be.false;
    });
    it('should add a blank field on click on "add a field" button', function() {
      element = this.initDirective(this.$scope);
      this.$scope.contact = {
        addresses: [
          {type: 'Home',
          street: 'Somewhere over the rainbow',
          zip: '777',
          city: 'Yolopolis',
          country: 'Yololand'},
          {type: 'Home',
          street: 'Somewhere else',
          zip: '666',
          city: 'Satantown',
          country: 'Hell'}
        ]
      };
      this.$scope.$digest();
      element.find('.multi-input-button').click();
      expect(this.eleScope.showAddButton).to.be.false;
      expect(this.eleScope.showNextField).to.be.true;
    });
    it('should display an "add a field" button when the at least one of the new inputs is not empty', function() {
      element = this.initDirective(this.$scope);
      this.$scope.contact = {
        addresses: [
          {type: 'Home',
          street: 'Somewhere over the rainbow',
          zip: '777',
          city: 'Yolopolis',
          country: 'Yololand'},
          {type: 'Home',
          street: 'Somewhere else',
          zip: '666',
          city: 'Satantown',
          country: 'Hell'}
        ]
      };
      this.$scope.$digest();
      element.find('.multi-input-button').click();
      expect(this.eleScope.showAddButton).to.be.false;
      expect(this.eleScope.showNextField).to.be.true;
      this.eleScope.newItem = {
        type: 'Other',
        street: 'a',
        zip: '',
        city: '',
        country: ''
      };
      this.eleScope.verifyNew();
      expect(this.eleScope.showAddButton).to.be.true;
    });
    it('should not display an "add a field" button when the all the new input are empty', function() {
      element = this.initDirective(this.$scope);
      this.$scope.contact = {
        addresses: [
          {type: 'Home',
          street: 'Somewhere over the rainbow',
          zip: '777',
          city: 'Yolopolis',
          country: 'Yololand'},
          {type: 'Home',
          street: 'Somewhere else',
          zip: '666',
          city: 'Satantown',
          country: 'Hell'}
        ]
      };
      this.$scope.$digest();
      element.find('.multi-input-button').click();
      expect(this.eleScope.showAddButton).to.be.false;
      expect(this.eleScope.showNextField).to.be.true;
      this.eleScope.newItem = {
        type: 'Other',
        street: '',
        zip: '',
        city: '',
        country: ''
      };
      this.eleScope.verifyNew();
      expect(this.eleScope.showAddButton).to.be.false;
    });
    it('should remove existing input when user empty all the fields', function() {
      element = this.initDirective(this.$scope);
      this.$scope.contact = {
        addresses: [
          {type: 'Home',
          street: 'Somewhere over the rainbow',
          zip: '777',
          city: 'Yolopolis',
          country: 'Yololand'},
          {type: 'Home',
          street: 'Somewhere else',
          zip: '666',
          city: 'Satantown',
          country: 'Hell'}
        ]
      };
      this.$scope.$digest();
      this.eleScope.content = [
        {type: 'Home',
        street: '',
        zip: '',
        city: '',
        country: ''},
        {type: 'Home',
        street: 'Somewhere else',
        zip: '666',
        city: 'Satantown',
        country: 'Hell'}
      ];
      this.eleScope.verifyRemove(0);
      expect(this.eleScope.content).to.deep.equal([
        {type: 'Home',
        street: 'Somewhere else',
        zip: '666',
        city: 'Satantown',
        country: 'Hell'}
     ]);
    });
  });
  describe('The multiInputGroup directive', function() {

    var element;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
      this.$compile = _$compile_;
      this.initDirective = function(scope) {
        var html = '<multi-input-group multi-input-model="contact.emails", multi-input-types="[]", multi-input-texttype="text", multi-input-placeholder="Email"></multi-input-group>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        this.eleScope = element.isolateScope();
        return element;
      };
    }));

    it('should load the existing content in inputs if there is', function() {
      this.initDirective(this.$scope);
      this.$scope.contact = {
        emails: [
          {type: 'Home',
          value: 'home@mail.com'},
          {type: 'Work',
          value: 'work@mail.com'}
        ]
      };
      this.$scope.$digest();
      expect(this.eleScope.content.length).to.be.equal(2);
      expect(this.eleScope.showNextField).to.be.false;
    });
    it('should display a blank input if there is no existing content', function() {
      this.initDirective(this.$scope);
      this.$scope.contact = {
        emails: []
      };
      this.$scope.$digest();
      expect(this.eleScope.content.length).to.be.equal(0);
      expect(this.eleScope.showNextField).to.be.true;
    });
    it('should display an "add a field button" when there is existing content', function() {
      this.initDirective(this.$scope);
      this.$scope.contact = {
        emails: [
          {type: 'Home',
          value: 'home@mail.com'},
          {type: 'Work',
          value: 'work@mail.com'}
        ]
      };
      this.$scope.$digest();
      expect(this.eleScope.showAddButton).to.be.true;
    });
    it('should not display an "add a field button" when there is no existing content', function() {
      this.initDirective(this.$scope);
      this.$scope.contact = {
        emails: []
      };
      this.$scope.$digest();
      expect(this.eleScope.showAddButton).to.be.false;
    });
    it('should add a blank field on click on "add a field" button', function() {
      element = this.initDirective(this.$scope);
      this.$scope.contact = {
        emails: [
          {type: 'Home',
          value: 'home@mail.com'},
          {type: 'Work',
          value: 'work@mail.com'}
        ]
      };
      this.$scope.$digest();
      element.find('.multi-input-button').click();
      expect(this.eleScope.showAddButton).to.be.false;
      expect(this.eleScope.showNextField).to.be.true;
    });
    it('should display an "add a field" button when the new input is not empty', function() {
      element = this.initDirective(this.$scope);
      this.$scope.contact = {
        emails: [
          {type: 'Home',
          value: 'home@mail.com'},
          {type: 'Work',
          value: 'work@mail.com'}
        ]
      };
      this.$scope.$digest();
      element.find('.multi-input-button').click();
      this.eleScope.newItem = {
        type: 'Other',
        value: 'other@mail.com'
      };
      this.eleScope.verifyNew();
      expect(this.eleScope.showAddButton).to.be.true;
    });
    it('should not display an "add a field" button when the new input is empty', function() {
      element = this.initDirective(this.$scope);
      this.$scope.contact = {
        emails: [
          {type: 'Home',
          value: 'home@mail.com'},
          {type: 'Work',
          value: 'work@mail.com'}
        ]
      };
      this.$scope.$digest();
      element.find('.multi-input-button').click();
      this.eleScope.newItem = {
        type: 'Other',
        value: ''
      };
      this.eleScope.verifyNew();
      expect(this.eleScope.showAddButton).to.be.false;
    });
    it('should remove existing input when user empty it', function() {
      element = this.initDirective(this.$scope);
      this.$scope.contact = {
        emails: [
          {type: 'Home',
          value: 'home@mail.com'},
          {type: 'Work',
          value: 'work@mail.com'}
        ]
      };
      this.$scope.$digest();
      this.eleScope.content = [
        {type: 'Home',
        value: ''},
        {type: 'Work',
        value: 'work@mail.com'}
      ];
      this.eleScope.verifyRemove(0);
      expect(this.eleScope.content).to.deep.equal([
       {type: 'Work',
       value: 'work@mail.com'}
     ]);
    });
  });
});
