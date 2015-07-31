'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The UI module', function() {

  describe('The fab directive', function() {

    beforeEach(module('esn.ui'));
    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();

      this.initDirective = function(scope) {
        var html = '<fab on-click="action()" type="{{type}}"/></fab>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }]));

    it('should set class to the one matching the fab action', function() {
      this.$scope.type = 'create';
      var element = this.initDirective(this.$scope);
      var i = element.find('i');
      expect(i.hasClass('mdi-plus')).to.be.true;
    });

    it('should set class to the default one when action is unknown', function() {
      this.$scope.type = 'unknownaction';
      var element = this.initDirective(this.$scope);
      var i = element.find('i');
      expect(i.hasClass('mdi-content-create')).to.be.true;
    });

    it('should call the scope action when clicking on the fab', function(done) {
      this.$scope.type = 'create';
      this.$scope.action = done();
      var element = this.initDirective(this.$scope);
      element.find('.btn').click();
    });
  });
});
