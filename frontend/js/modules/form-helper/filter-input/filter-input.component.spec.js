'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnFilterInput component', function() {

  var $compile, $scope, $rootScope, $timeout, esnI18nService;

  esnI18nService = {
    translate: sinon.stub().returnsArg(0)
  };

  function compileComponent(html) {
    var element = $compile(html)($scope);

    $scope.$digest();

    $timeout.flush();

    return element;
  }

  beforeEach(function() {
    module('jadeTemplates', 'esn.form.helper');

    module(function($provide) {
      $provide.value('esnI18nService', esnI18nService);
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $scope = $rootScope.$new();
    $timeout = _$timeout_;
  }));

  it('should clear the input and notify when the "clear" icon is clicked', function() {
    $scope.filter = {
      text: ''
    };

    var element = compileComponent('<esn-filter-input on-change="filter.text = $filter" />');

    var input = element.find('input');

    input.val('text').trigger('input');
    $timeout.flush(); // for the 'debounce' option

    expect($scope.filter.text).to.equal('text');

    element.find('.esn-filter-input-clear-btn').click();

    expect($scope.filter.text).to.equal('');
    expect(input.val()).to.equal('');
  });

  it('should translate placeholder', function() {
    compileComponent('<esn-filter-input placeholder="Some placeholder" />');

    expect(esnI18nService.translate).to.have.been.calledWith('Some placeholder');
  });

  it('should fall back to "standard" view when an unsupported variant is provided', function() {
    var element = compileComponent('<esn-filter-input variant="some-unsupported-variant" />');

    expect(element.find('.fg-line').length).to.equal(1);
  });
});
