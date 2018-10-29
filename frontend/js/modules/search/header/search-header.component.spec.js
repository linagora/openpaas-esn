'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnSearchHeader component', function() {
  var $state, $stateParams, element, $compile, $rootScope, scope;

  beforeEach(function() {
    angular.mock.module('esn.search', 'jadeTemplates');
    angular.mock.module('esn.configuration');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$stateParams_, _$state_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $stateParams = _$stateParams_;
    $state = _$state_;

    scope = $rootScope.$new();
  }));

  function compileSearchHeaderDirective() {
    var html = '<esn-search-header></esn-search-header>';

    element = $compile(html)(scope);
    scope.$digest();
  }

  function submitWithText() {
    element.find('input').val('cow').trigger('input');
    element.find('form button[type=submit]').click();
  }

  it('should init search field with q get parameter', function() {
    $stateParams.q = 'a query';
    compileSearchHeaderDirective();

    expect(element.find('input').val()).to.equal('a query');
  });

  it('should clear search input', function() {
    $stateParams.q = 'a query';

    compileSearchHeaderDirective();

    element.find('.clean-button').click();

    expect(element.find('input').val()).to.equal('');
  });

  it('when form submitted in a different state, it should update query parameter', function() {
    $state.go = sinon.spy($state.go);

    compileSearchHeaderDirective();
    submitWithText();

    expect($state.go).to.have.been.calledWith('search.main', { a: null, q: 'cow', p: null }, { reload: true });
  });

  it('when form submitted in the same state, it should update q get parameter and replace location', function() {
    $state.go('search.main');
    $state.go = sinon.spy($state.go);

    compileSearchHeaderDirective();
    submitWithText();

    expect($state.go).to.have.been.calledWith('search.main', { a: null, p: null, q: 'cow'}, { location: 'replace', reload: true });
  });
});
