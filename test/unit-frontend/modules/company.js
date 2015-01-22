'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Company Angular module', function() {
  beforeEach(angular.mock.module('esn.company'));

  describe('companyAPI service', function() {
    describe('search() method', function() {

      beforeEach(angular.mock.inject(function(companyAPI, $httpBackend) {
        this.companyAPI = companyAPI;
        this.$httpBackend = $httpBackend;
        this.companyName = 'aaaa-bbbb-cccc';
        this.response = [];
      }));

      it('should send a request to /companies?name=:name', function() {
        this.$httpBackend.expectGET('/companies?name=' + this.companyName).respond(this.response);
        this.companyAPI.search({name: this.companyName});
        this.$httpBackend.flush();
      });

      it('should return a promise', function() {
        var promise = this.companyAPI.search({name: this.companyName});
        expect(promise.then).to.be.a.function;
      });
    });
  });

  describe('ensureUniqueCompany directive', function() {
    var html = '<form name="form"><input type="text" name="company" ng-model="settings.company" ensure-unique-company></form>';
    beforeEach(inject(['$compile', '$rootScope', '$httpBackend', function($c, $r, $h) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$httpBackend = $h;
      this.companyName = 'aaaa-bbbb-cccc';
      this.response = [];
    }]));

    afterEach(function() {
      this.$httpBackend.verifyNoOutstandingExpectation();
    });

    it('should set an ajax error when REST request is going on', function() {
      this.$httpBackend.expectGET('/companies?name=' + this.companyName).respond(this.response);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.companyName);
      input.trigger('change');
      expect(scope.form.company.$error.ajax).to.be.true;
    });

    it('should call the companyAPI get() method', function() {
      this.$httpBackend.expectGET('/companies?name=' + this.companyName).respond(this.response);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      input.val(this.companyName);
      input.trigger('change');
      this.$httpBackend.flush();
    });

    it('should remove the ajax error and set a unique=true error when the company already exists', function() {
      this.$httpBackend.expectGET('/companies?name=' + this.companyName).respond(this.response);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.companyName);
      input.trigger('change');
      this.$httpBackend.flush();
      scope.$digest();
      expect(scope.form.company.$error.ajax).to.be.undefined;
      expect(scope.form.company.$error.unique).to.be.true;
    });

    it('should remove the ajax error and set a unique=undefined error when the company does not exist', function() {
      this.$httpBackend.expectGET('/companies?name=' + this.companyName).respond(404, this.response);
      var element = this.$compile(html)(this.$rootScope);
      var input = element.find('input');
      var scope = element.scope();
      input.val(this.companyName);
      input.trigger('change');
      this.$httpBackend.flush();
      scope.$digest();
      expect(scope.form.company.$error.ajax).to.be.undefined;
      expect(scope.form.company.$error.unique).to.be.undefined;
    });
  });


  describe('companyUser service', function() {
    beforeEach(angular.mock.inject(function(companyUserService) {
      this.companyUserService = companyUserService;
      this.companyName = 'linagora';
    }));
    describe('isInternalUser() method', function() {
      it('should return true if user is internal', function() {
        expect(this.companyUserService.isInternalUser('user@linagora.com', this.companyName)).to.be.true;
      });

      it('should return true if user is external', function() {
        expect(this.companyUserService.isInternalUser('user@pipo.com', this.companyName)).to.be.false;
      });
    });
    describe('getCompany method', function() {
      it('should return the company part of the email', function() {
        expect(this.companyUserService.getCompany('user@linagora.com')).to.equal('linagora.com');
      });
    });
    describe('prettyCompany method', function() {
      it('should make users pretty', function() {
        expect(this.companyUserService.prettyCompany('user@linagora.com')).to.equal('Linagora');
      });
      it('should make the company pretty', function() {
        expect(this.companyUserService.prettyCompany('linagora.com')).to.equal('Linagora');
      });
    });
  });
});
