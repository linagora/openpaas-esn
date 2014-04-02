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
      var templateAsHtmlString ='<form role="form" class="ng-pristine ng-valid">'+
        '<div>'+
        '<div class="input-group col-md-12">'+
        '<input type="text" ng-model="searchInput" ng-change="search.status=&quot;none&quot;" placeholder="Search" class="search-query form-control ng-pristine ng-valid">'+
        '<span class="input-group-btn">'+
        '<button type="button" ng-click="doSearch()" class="btn btn-info">'+
        '<span class="glyphicon glyphicon-search"></span>'+
        '</button>'+
        '</span>'+
        '</div>'+
        '<div ng-show="search.status==&quot;error&quot;" class="ng-hide">'+
        '<div class="text-danger ng-binding">: </div>'+
        '</div>'+
        '<div ng-show="search.running==&quot;true&quot;" class="throbber ng-hide">'+
        '<span us-spinner="us-spinner" spinner-key="searchSpinner" spinner-start-active="1"></span>'+
        '</div>'+
        '</div>'+
        '</form>';
        return templateAsHtmlString;
      };
    });

    it('should display a search from the scope using the template', function() {
      var html = '<search-form search-spinner-key="searchspinner"></search-form>';
      var element = this.$compile(html)(this.$rootScope);

      this.$rootScope.searchspinner = 'searchSpinner';

      this.$rootScope.$digest();
      expect(element.html()).to.equal(this.getExpectedHtmlForSearchForm());
    });
  });

});

