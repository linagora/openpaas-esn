'use strict';

/* global chai, sinon: false */

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

  describe('The searchHeaderFormDirective', function() {
    var $locationMock, element, $compile, $rootScope;

    beforeEach(function() {
      $locationMock = {
        search: sinon.stub().returns({q: 'search'})
      };
      angular.mock.module('jadeTemplates');
      angular.mock.module('esn.search', function($provide) {
        $provide.value('$location', $locationMock);
      });
    });

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    }));

    beforeEach(function() {
      var html = '<search-sub-header></search-sub-header>';

      element = $compile(html)($rootScope);
      $rootScope.$digest();
    });

    it('should init search field with q get parameter', function() {
      expect($locationMock.search).to.have.been.calledOnce;
      expect(element.find('input').val()).to.equal('search');
    });

    it('when form submitted it should update q get parameter', function() {
      element.find('input').val('cow').trigger('input');
      element.find('form').trigger('submit');
      expect($locationMock.search).to.have.been.calledWith('q', 'cow');
    });

  });

  describe('searchResultController', function() {
    var $controller, $scope, $stateParams, $q, query, searchProviders, $rootScope, ELEMENTS_PER_PAGE;

    function initController() {
      $scope = {};
      $controller('searchResultController', {$scope: $scope});
      $rootScope.$digest();
    }

    function buildIterator(list) {
      var i = 0;
      return function() {
        return $q.when({data: list[i++]});
      };
    }

    function callLoadMoreElements(iterations) {
      for (var i = 0; i < iterations; i++) {
        $scope.loadMoreElements();
        $rootScope.$digest();
      }
    }

    beforeEach(function() {
      query = {};
      searchProviders = {
        getAll: sinon.spy(function() {
          return $q.when([{
            name: 'cat',
            loadNextItems: buildIterator([
              [{name: 'cat1', date: new Date(2016, 4, 1)}, {name: 'cat2', date: new Date(2016, 3, 1)}],
              [{name: 'cat3', date: new Date(2016, 2, 1)}, {name: 'cat4', date: new Date(2016, 1, 1)}]])
          }, {
            name: 'dog',
            loadNextItems: buildIterator([
              [{name: 'dog1', date: new Date(2016, 4, 2)}, {name: 'dog2', date: new Date(2016, 3, 2)}],
              [{name: 'dog3', date: new Date(2016, 2, 2)}, {name: 'dog4', date: new Date(2016, 1, 2)}]])
          }]);
        })
      };
      $stateParams = {q: query};
      angular.mock.module('esn.search', function($provide) {
        $provide.value('$stateParams', $stateParams);
        $provide.value('searchProviders', searchProviders);
        $provide.constant('ELEMENTS_PER_PAGE', ELEMENTS_PER_PAGE = 2);
      });
    });

    beforeEach(inject(function(_$controller_, _$q_, _$rootScope_) {
      $controller = _$controller_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      initController();
    }));

    it('should init $scope.query for highlight', function() {
      expect($scope.query).to.deep.equal(query);
    });

    it('should have call searchProviders with the correct arguments when loadMoreElements is called', function() {
      $scope.loadMoreElements();
      expect(searchProviders.getAll).to.have.been.calledWith({ query: query });
    });

    describe('$scope.elements', function() {

      it('should contain as many elements "ordered by date" as specified in ELEMENTS_PER_PAGE after the first loadMoreElements()', function() {
        callLoadMoreElements(1);

        expect($scope.elements.length).to.equal(ELEMENTS_PER_PAGE);
        expect($scope.elements).to.shallowDeepEqual([{name: 'dog1'}, {name: 'cat1'}]);
      });

      it('should be pushed by ELEMENTS_PER_PAGE elements after each loadMoreElements() and always respect the order by date', function() {
        var iterations = 3;
        callLoadMoreElements(iterations);

        expect($scope.elements.length).to.equal(ELEMENTS_PER_PAGE * iterations);
        expect($scope.elements).to.shallowDeepEqual(
          [{name: 'dog1'}, {name: 'cat1'}, {name: 'dog2'}, {name: 'cat2'}, {name: 'dog3'}, {name: 'cat3'}]
        );
      });
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
      expect(service().hits).to.equal(0);
      expect(service().isFormatted).to.be.false;
    });

    it('should return 0 when input is 0', function() {
      expect(service(0).hits).to.equal(0);
      expect(service(0).isFormatted).to.be.false;
    });

    it('should return the input when lower than limit', function() {
      expect(service(555).hits).to.equal(555);
      expect(service(555).isFormatted).to.be.false;
    });

    it('should return limit when input is around limit', function() {
      expect(service(1001).hits).to.equal(1000);
      expect(service(1001).isFormatted).to.be.true;
    });

    it('should round to lower ten', function() {
      expect(service(2542).hits).to.equal(2540);
      expect(service(2542).isFormatted).to.be.true;
    });

    it('should round to higher ten', function() {
      expect(service(2546).hits).to.equal(2550);
      expect(service(2546).isFormatted).to.be.true;
    });
  });
});
