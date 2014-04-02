
'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Infinite-list Angular module', function() {

  beforeEach(angular.mock.module('esn.infinite-list'));

  describe('infinite-list directive', function() {

    //Load the karma built module containing the templates
    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    beforeEach(function() {
      this.checkGeneratedElement = function(element, distance, disabled, immediateCheck) {
        var checkGeneratedAttributeValue = function(element, attrName, attrValue) {
          expect(element.contents()[0].attributes.getNamedItem(attrName).value).to.equal(attrValue);
        };
        checkGeneratedAttributeValue(element, 'infinite-scroll-distance', distance);
        checkGeneratedAttributeValue(element, 'infinite-scroll-disabled', disabled);
        checkGeneratedAttributeValue(element, 'infinite-scroll-immediate-check', immediateCheck);
      };
    });

    it('should fill the template with values from the scope', function() {
      var html = '<infinite-list><span>Inner Element</span></infinite-list>';
      this.$rootScope.infiniteScrollDistance = 10;
      this.$rootScope.infiniteScrollDisabled = true;
      this.$rootScope.infiniteScrollImmediateCheck = false;

      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      this.checkGeneratedElement(element, '10', 'true', 'false');
    });

    it('should fill the template with default values if no values were defined in the scope', inject(function(defaultConfiguration) {
      var html = '<infinite-list><span>Inner Element</span></infinite-list>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      this.checkGeneratedElement(element, defaultConfiguration.scrollDistance, defaultConfiguration.scrollDisabled, defaultConfiguration.scrollImmediateCheck);
    }));

  });

});
