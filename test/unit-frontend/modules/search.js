'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Search Form Angular module', function() {

  beforeEach(angular.mock.module('esn.search'));

  describe('searchForm directive', function() {
    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    beforeEach(function() {
      this.checkGeneratedElement = function(element, spinnerKey, spinnerConf) {
        var checkGeneratedAttributeValue = function(element, attrName, attrValue) {
          expect(element.find('span')[0].attributes.getNamedItem(attrName).value).to.equal(attrValue);
        };

        checkGeneratedAttributeValue(element, 'spinner-key', spinnerKey);
        checkGeneratedAttributeValue(element, 'us-spinner', JSON.stringify(spinnerConf));
      };
    });

    it('should fill the search-form template with default throbber values if no values were defined in the scope', inject(function(defaultSpinnerConfiguration) {
      var html = '<search-form></search-form>';
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();

      this.checkGeneratedElement(element, defaultSpinnerConfiguration.spinnerKey, defaultSpinnerConfiguration.spinnerConf);
    }));

    it('should fill the search-form template with throbber values from the scope', function() {
      var html = '<search-form></search-form>';

      this.$rootScope.spinnerKey = 'spinnerKey';
      this.$rootScope.spinnerConf = {radius: 30, width: 8, length: 16};

      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      this.checkGeneratedElement(element, 'spinnerKey', {radius: 30, width: 8, length: 16});
    });
  });

  describe('The searchResultSizeFormatter service', function() {

    var service;

    beforeEach(function() {
      inject(function($injector) {
        service = $injector.get('searchResultSizeFormatter');
      });
    });

    it('should return 0 when input is undefined', function() {
      expect(service()).to.equal(0);
    });

    it('should return 0 when input is 0', function() {
      expect(service(0)).to.equal(0);
    });

    it('should return the input when lower than limit', function() {
      expect(service(555)).to.equal(555);
    });

    it('should return limit when input is around limit', function() {
      expect(service(1001)).to.equal(1000);
    });

    it('should round to lower decade', function() {
      expect(service(2542)).to.equal(2540);
    });

    it('should round to higher decade', function() {
      expect(service(2546)).to.equal(2550);
    });
  });
});
