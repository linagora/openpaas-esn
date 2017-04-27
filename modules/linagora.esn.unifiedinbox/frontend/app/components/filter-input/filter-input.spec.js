'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The inboxFilterInput component', function() {

  var $compile, $rootScope, $timeout, element;

  function compileDirective(html) {
    element = angular.element(html);
    element.appendTo(document.body);

    $compile(element)($rootScope.$new());
    $timeout.flush();

    return element;
  }

  afterEach(function() {
    if (element) {
      element.remove();
    }
  });

  beforeEach(module('jadeTemplates', 'linagora.esn.unifiedinbox'));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
  }));

  it('should clear the input and notify when the "clear" icon is clicked', function() {
    $rootScope.filter = {
      text: ''
    };

    compileDirective('<inbox-filter-input on-change="filter.text = $filter" />');

    var input = element.find('input');

    input.val('text').trigger('input');
    $timeout.flush(); // for the 'debounce' option

    expect($rootScope.filter.text).to.equal('text');

    element.find('.inbox-filter-input-clear').click();

    expect($rootScope.filter.text).to.equal('');
    expect(input.val()).to.equal('');
  });

});
