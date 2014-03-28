'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Search Form Angular module', function() {

  beforeEach(angular.mock.module('esn.search'));

  describe('searchForm directive', function() {

    //Load the karma built module containing the templates
    beforeEach(module('jadeTemplates'));

    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
    }]));

    beforeEach(function() {
      this.getExpectedHtmlForSearchForm = function() {
      var templateAsHtmlString = '<form role="form" class="ng-pristine ng-valid">' +
        '<div id="custom-search-input">' +
        '<div class="input-group col-md-12">' +
        '<input type="text" ng-model="searchInput" ng-change="search.status=&quot;none&quot;" id="searchInput" placeholder="Search" class="search-query form-control ng-pristine ng-valid">' +
        '<span class="input-group-btn">' +
        '<button type="button" ng-click="search()" class="btn btn-info">' +
        '<span class="glyphicon glyphicon-search"></span>' +
        '</button>' +
        '</span>' +
        '</div>' +
        '<div ng-show="search.status==\'error\'" class="ng-hide">' +
        '<div class="text-danger ng-binding">: </div>' +
        '</div>' +
        '<div ng-show="search.running==\'true\'" class="ng-hide">' +
        '<div class="throbber"></div>' +
        '</div>' +
        '</div>' +
        '</form>';
        return templateAsHtmlString;
      };
    });

    it('should display a search from the scope using the template', function() {
      var html = '<search-form searchTitle="Example"></search-form>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.$digest();
      expect(element.html()).to.equal(this.getExpectedHtmlForSearchForm());
    });
  });

});