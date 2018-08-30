'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The application-menu component', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('mgcrea.ngStrap');
    angular.mock.module('esn.lodash-wrapper');
    angular.mock.module('esn.application-menu');
  });

  describe('applicationMenuTemplateBuilder service', function() {
    beforeEach(angular.mock.inject(function(applicationMenuTemplateBuilder) {
      this.applicationMenuTemplateBuilder = applicationMenuTemplateBuilder;
    }));

    it('should return the correct template when icon name is given', function() {
      expect(this.applicationMenuTemplateBuilder('/#/awesomestuffthere', { name: 'awesomeness' }, 'ClickMe'))
        .to.equal('<div><a href="/#/awesomestuffthere"><img class="esn-application-menu-icon" src="/images/application-menu/awesomeness-icon.svg" fallback-src="/images/application.png"/><span class="label" translate>ClickMe</span></a></div>');
    });

    it('should return the correct template when icon url is given', function() {
      expect(this.applicationMenuTemplateBuilder('/#/awesomestuffthere', { url: '/module/images/awesomeness' }, 'ClickMe'))
        .to.equal('<div><a href="/#/awesomestuffthere"><img class="esn-application-menu-icon" src="/module/images/awesomeness" fallback-src="/images/application.png"/><span class="label" translate>ClickMe</span></a></div>');
    });
  });

  describe('application-menu-toggler directive', function() {
    beforeEach(angular.mock.inject(function($document, $rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.$compile = $compile;
      this.$document = $document;

      this.initDirective = function(scope) {
        var html = '<application-menu-toggler/>';
        var element = this.$compile(html)(scope);

        scope.$digest();
        this.eleScope = element.isolateScope();

        return element;
      };
    }));

    it('should append the backdrop on application-menu.show.before and remove it on application-menu.hide.before', function() {
      var element = this.initDirective(this.$scope);
      var body = this.$document.find('body').eq(0);

      body.append(element);

      element.click(); // toggle $popover and show it
      expect(body.find('#application-menu-backdrop').length).to.equal(1);

      element.click(); // toggle $popover and hide it
      expect(body.find('#application-menu-backdrop').length).to.equal(0);

      element.remove();
    });
  });

  describe('force-close-on-links-click directive', function() {
    beforeEach(angular.mock.inject(function($document, $rootScope, $compile, $timeout) {
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.$compile = $compile;
      this.$timeout = $timeout;
      this.$document = $document;

      this.initDirective = function(scope) {
        var html = '<div force-close-on-links-click><a/></div>';
        var element = this.$compile(html)(scope);

        scope.$digest();
        this.eleScope = element.isolateScope();

        return element;
      };
    }));

    it('should bind on tag a click, a call to $hide', function(done) {
      this.$scope.$parent.$hide = done;
      var element = this.initDirective(this.$scope);
      var body = this.$document.find('body').eq(0);

      body.append(element);
      this.$timeout.flush();
      var link = element.find('a');

      link.click();
      element.remove();
    });
  });

  describe('force-margin-left directive', function() {
    beforeEach(angular.mock.inject(function($document, $rootScope, $compile, $timeout) {
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.$compile = $compile;
      this.$timeout = $timeout;
      this.$document = $document;

      this.initDirective = function(scope) {
        var html = '<div force-margin-left="15"/>';
        var element = this.$compile(html)(scope);

        scope.$digest();
        this.eleScope = element.isolateScope();

        return element;
      };
    }));

    it('should set a new left offset after timeout', function() {
      var element = this.initDirective(this.$scope);
      var body = this.$document.find('body').eq(0);

      body.append(element);
      angular.element(element).offset({top: 15, left: 30});
      this.$timeout.flush();

      expect(angular.element(element).offset()).to.deep.equal({top: 15, left: 15});
      element.remove();
    });
  });

});
