'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Injection Angular module', function() {

  beforeEach(angular.mock.module('esn.injection'));

  describe('the injectionsWidget directive', function() {

    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.$compile = $compile;
      this.scope = $rootScope.$new();
      this.scope.subject = {
        _id: '123'
      };
      this.anchorId = 'testAnchor';
      this.html = '<injections-widget injection-anchor-id="testAnchor" injection-subject="subject"/>';
    }));

    it('should hide the element if no anchor is defined', function() {
      var noAnchorHtml = '<injections-widget injection-subject="subject"/>';
      var element = this.$compile(noAnchorHtml)(this.scope);
      this.scope.$digest();
      expect(element[0].getAttribute('style')).to.contain('display: none');
    });

    it('should hide the element if subject has no injections', function() {
      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(element[0].getAttribute('style')).to.contain('display: none');
    });

    it('should hide the element if subject has no injections for this anchor', function() {
      this.scope.subject.injections = [
        {
          key: 'otherAnchor',
          values: [
            { directive: 'directive3', attributes: [{ name: 'att4', value: 'value4' }] }
          ]
        }
      ];
      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(element[0].getAttribute('style')).to.contain('display: none');
    });

    it('should build directive form injections and show the element', function() {
      this.scope.subject.injections = [
        {
          key: this.anchorId,
          values: [
            { directive: 'directive1', attributes: [{ name: 'att1', value: 'value1' }] }
          ]
        },
        {
          key: this.anchorId,
          values: [
            { directive: 'directive2', attributes: [{ name: 'att2', value: 'value2' }, { name: 'att3', value: 'value3' }] }
          ]
        },
        {
          key: 'otherAnchor',
          values: [
            { directive: 'directive3', attributes: [{ name: 'att4', value: 'value4' }] }
          ]
        }
      ];
      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(element[0].getAttribute('style')).to.not.contain('display: none');

      var generatedHtml = element.children();
      expect(generatedHtml.length).to.equal(2);

      var directive1 = generatedHtml[0];
      expect(directive1.nodeName.toLowerCase()).to.equal('directive1');
      expect(directive1.getAttribute('att1')).to.equal('value1');

      var directive2 = generatedHtml[1];
      expect(directive2.nodeName.toLowerCase()).to.equal('directive2');
      expect(directive2.getAttribute('att2')).to.equal('value2');
      expect(directive2.getAttribute('att3')).to.equal('value3');

      expect(element.html()).to.not.contain('directive3');
      expect(element.html()).to.not.contain('att4');
      expect(element.html()).to.not.contain('value4');
    });
  });

});
