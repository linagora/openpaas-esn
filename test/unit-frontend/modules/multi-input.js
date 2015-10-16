'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The multi-input Angular module', function() {

  beforeEach(function() {
    angular.mock.module('esn.multi-input');
    module('jadeTemplates');
  });


  describe('The multiInputGroupAddress directive', function() {

    var element;

    beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, $controller) {
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
      this.$compile = _$compile_;
      this.$timeout = _$timeout_;
      this.initDirective = function(scope) {
        var html = '<multi-input-group-address multi-input-model="contact.addresses", multi-input-types="[]"></multi-input-group-address>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        this.eleScope = element.isolateScope();
        this.eleScope.types = ['Home', 'Work', 'Other'];
        $controller('MultiInputGroupController', {
          $scope: this.eleScope
        });
        return element;
      };
    }));

    it('should load the existing content in inputs if there is', function() {
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
      this.initDirective(this.$scope);
      expect(this.eleScope.content.length).to.be.equal(2);
      expect(this.eleScope.showNextField).to.be.false;
    });
    it('should display a blank input if there is no existing content', function() {
      this.$scope.contact = {
        addresses: []
      };
      this.initDirective(this.$scope);
      expect(this.eleScope.content.length).to.be.equal(0);
      expect(this.eleScope.showNextField).to.be.true;
    });
    it('should display an "add a field button" when there is existing content', function() {
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
      this.initDirective(this.$scope);
      expect(this.eleScope.showAddButton).to.be.true;
    });
    it('should not display an "add a field button" when there is no existing content', function() {
      this.$scope.contact = {
        addresses: []
      };
      this.initDirective(this.$scope);
      expect(this.eleScope.showAddButton).to.be.false;
    });
    it('should add a blank field on click on "add a field" button', function() {
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
      element = this.initDirective(this.$scope);
      element.find('.multi-input-button').click();
      expect(this.eleScope.showAddButton).to.be.false;
      expect(this.eleScope.showNextField).to.be.true;
    });
    it('should set the focus on the newly created street field', function() {
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
      element = this.initDirective(this.$scope);
      element.find('.multi-input-button').click();
      expect(this.eleScope.showAddButton).to.be.false;
      expect(this.eleScope.showNextField).to.be.true;
      var spy = sinon.spy(element.find('.input-next')[0], 'focus');
      this.$timeout.flush();
      expect(spy).to.have.been.calledOnce;
    });
    it('should display an "add a field" button when the at least one of the new inputs is not empty', function() {
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
      element = this.initDirective(this.$scope);
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
      element = this.initDirective(this.$scope);
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
      element = this.initDirective(this.$scope);
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

    beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, $controller) {
      this.$rootScope = _$rootScope_;
      this.$scope = this.$rootScope.$new();
      this.$compile = _$compile_;
      this.$timeout = _$timeout_;

      this.initDirective = function(scope) {
        var html = '<multi-input-group multi-input-model="contact.emails", multi-input-types="[]", multi-input-texttype="text", multi-input-placeholder="Email"></multi-input-group>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        this.eleScope = element.isolateScope();
        this.eleScope.types = ['Home', 'Work', 'Other'];
        $controller('MultiInputGroupController', {
          $scope: this.eleScope
        });
        return element;
      };
    }));

    it('should load the existing content in inputs if there is', function() {
      this.$scope.contact = {
        emails: [
          {type: 'Home',
            value: 'home@mail.com'},
          {type: 'Work',
            value: 'work@mail.com'}
        ]
      };
      this.initDirective(this.$scope);
      expect(this.eleScope.content.length).to.be.equal(2);
      expect(this.eleScope.showNextField).to.be.false;
    });
    it('should display a blank input if there is no existing content', function() {
      this.$scope.contact = {
        emails: []
      };
      this.initDirective(this.$scope);
      expect(this.eleScope.content.length).to.be.equal(0);
      expect(this.eleScope.showNextField).to.be.true;
    });
    it('should display an "add a field button" when there is existing content', function() {
      this.$scope.contact = {
        emails: [
          {type: 'Home',
            value: 'home@mail.com'},
          {type: 'Work',
            value: 'work@mail.com'}
        ]
      };
      this.initDirective(this.$scope);
      expect(this.eleScope.showAddButton).to.be.true;
    });
    it('should not display an "add a field button" when there is no existing content', function() {
      this.$scope.contact = {
        emails: []
      };
      this.initDirective(this.$scope);
      expect(this.eleScope.showAddButton).to.be.false;
    });
    it('should add a blank field on click on "add a field" button', function() {
      this.$scope.contact = {
        emails: [
          {type: 'Home',
            value: 'home@mail.com'},
          {type: 'Work',
            value: 'work@mail.com'}
        ]
      };
      element = this.initDirective(this.$scope);
      element.find('.multi-input-button').click();
      expect(this.eleScope.showAddButton).to.be.false;
      expect(this.eleScope.showNextField).to.be.true;
    });
    it('should set the focus on the newly created street field', function() {
      this.$scope.contact = {
        emails: [
          {type: 'Home',
            value: 'home@mail.com'},
          {type: 'Work',
            value: 'work@mail.com'}
        ]
      };
      element = this.initDirective(this.$scope);
      element.find('.multi-input-button').click();
      expect(this.eleScope.showAddButton).to.be.false;
      expect(this.eleScope.showNextField).to.be.true;
      var spy = sinon.spy(element.find('.input-next')[0], 'focus');
      this.$timeout.flush();
      expect(spy).to.have.been.calledOnce;
    });
    it('should display an "add a field" button when the new input is not empty', function() {
      this.$scope.contact = {
        emails: [
          {type: 'Home',
            value: 'home@mail.com'},
          {type: 'Work',
            value: 'work@mail.com'}
        ]
      };
      element = this.initDirective(this.$scope);
      element.find('.multi-input-button').click();
      this.eleScope.newItem = {
        type: 'Other',
        value: 'other@mail.com'
      };
      this.eleScope.verifyNew();
      expect(this.eleScope.showAddButton).to.be.true;
    });
    it('should not display an "add a field" button when the new input is empty', function() {
      this.$scope.contact = {
        emails: [
          {type: 'Home',
            value: 'home@mail.com'},
          {type: 'Work',
            value: 'work@mail.com'}
        ]
      };
      element = this.initDirective(this.$scope);
      element.find('.multi-input-button').click();
      this.eleScope.newItem = {
        type: 'Other',
        value: ''
      };
      this.eleScope.verifyNew();
      expect(this.eleScope.showAddButton).to.be.false;
    });
    it('should remove existing input when user empty it', function() {
      this.$scope.contact = {
        emails: [
          {type: 'Home',
            value: 'home@mail.com'},
          {type: 'Work',
            value: 'work@mail.com'}
        ]
      };
      element = this.initDirective(this.$scope);
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

    it('should hide the type select option when no types specified', function() {
      this.$scope.contact = { emails: [] };
      element = this.initDirective(this.$scope);

      this.eleScope.types = null;
      this.eleScope.$digest();

      expect(this.eleScope.isMultiTypeField()).to.be.false;
      expect(element.html()).to.not.have.string('select');
    });

    it('should not hide the type select option when types is specified', function() {
      this.$scope.contact = { emails: [] };
      element = this.initDirective(this.$scope);

      this.eleScope.types = ['Work'];
      this.eleScope.$digest();

      expect(this.eleScope.isMultiTypeField()).to.be.true;
      expect(element.html()).to.have.string('select');
    });

  });


  describe('The MultiInputGroupController controller', function() {

    var MultiInputGroupController, $scope;

    beforeEach(inject(function($rootScope, $controller) {
      $scope = $rootScope.$new();
      MultiInputGroupController = $controller('MultiInputGroupController', { $scope: $scope });
    }));

    describe('The _updateTypes fn', function() {

      it('should update the type when types are specified', function() {
        $scope.types = ['Work'];
        $scope.newItem = {};
        $scope.$digest();
        expect($scope.newItem.type).to.equal('Work');
      });

      it('should not update the type when no types specified', function() {
        $scope.types = [];
        $scope.newItem = {};
        $scope.$digest();
        expect($scope.newItem.type).to.not.be.defined;
      });

    });

  });


});
