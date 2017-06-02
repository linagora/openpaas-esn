'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The searchHeader component', function() {
  var $state, $stateParams, element, $compile, $rootScope, scope, $window;

  beforeEach(function() {
    angular.mock.module('esn.header', function($provide) {
      $provide.value('$stateParams', $stateParams = {});
      $provide.value('$state', $state = {go: sinon.spy(), includes: sinon.spy(), current: {name: ''} });
    });
    angular.mock.module('jadeTemplates');
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$stateParams_, _$window_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $stateParams = _$stateParams_;
    $window = _$window_;
    $window.onbeforeunload = sinon.spy();
    scope = $rootScope.$new();
  }));

  function compileSearchHeaderDirective() {
    var html = '<search-header></search-header>';
    element = $compile(html)(scope);
    scope.$digest();
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

  it('when form submitted in a different state, it should update q get parameter', function() {
    compileSearchHeaderDirective();

    element.find('input').val('cow').trigger('input');
    element.find('form').trigger('submit');

    expect($state.go).to.have.been.calledWith('search.main', { q: 'cow', filters: undefined }, { reload: true });
  });

  it('when form submitted in the same state, it should update q get parameter and replace location', function() {
    $state.current.name = 'search.main';

    compileSearchHeaderDirective();

    element.find('input').val('cow').trigger('input');
    element.find('form').trigger('submit');

     expect($state.go).to.have.been.calledWith('search.main', { q: 'cow', filters: undefined }, { location: 'replace', reload: true });
  });
});
