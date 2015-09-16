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

    var $compile, $rootScope, element, $scope, DATE_FORMAT;

    beforeEach(inject(function(_$compile_, _$rootScope_, _DATE_FORMAT_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      DATE_FORMAT = _DATE_FORMAT_;

      $scope = $rootScope.$new();
    }));

    beforeEach(function() {
      element = $compile('<form name="form"><input type="text" name="date" relaxed-date ng-model="date" /></form>')($scope);
    });

    it('should define the placeholder on the element', function() {
      expect(element.find('input').attr('placeholder')).to.equal(DATE_FORMAT);
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
});
