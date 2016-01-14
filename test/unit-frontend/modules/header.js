'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.header Angular module', function() {

  beforeEach(function() {
    module('jadeTemplates');
    module('esnApp');
    module('esn.sidebar');
    module('esn.header');
  });

  describe('The mainHeader directive', function() {
    var spy = sinon.spy();

    beforeEach(module(function($provide) {
      $provide.provider('sidebarDirective', function() {
        this.$get = function() { return {}; };
      });
      $provide.provider('apiNotificationDirective', function() {
        this.$get = function() { return {}; };
      });
      $provide.value('headerService', {
        subHeader: {
          hasInjections: spy
        }
      });
    }));

    beforeEach(inject(function($compile, $rootScope) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();

      var html = '<main-header></main-header>';
      this.element = this.$compile(html)(this.$scope);
      this.$scope.$digest();
    }));

    it('should recompute sub header injections on \'sub-header:hasInjection\'', function() {
      this.$rootScope.$broadcast('sub-header:hasInjection', true);
      expect(spy).to.have.been.called;
      expect(this.$scope.hasSubHeaderGotInjections).to.be.true;
    });

    describe('the hideEventListener', function() {

      it('should hide header when a hide-header event is received', function() {
        this.$rootScope.$broadcast('header:hide', '');
        expect(this.element.hasClass('hidden')).to.equal(true);
      });

      it('should show header when a show-header event is received', function() {
        this.$rootScope.$broadcast('header:show', '');
        expect(this.element.hasClass('hidden')).to.equal(false);
      });
    });

  });
});
