'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnFilterInput component', function() {

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

  beforeEach(function() {
    module('jadeTemplates', 'esn.form.helper');

    module(function($provide) {
      $provide.value('esnI18nService', {
        translate: function(input) {
          return input;
        }
      });
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
  }));

  it('should clear the input and notify when the "clear" icon is clicked', function() {
    $rootScope.filter = {
      text: ''
    };

    compileDirective('<esn-filter-input on-change="filter.text = $filter" />');

    var input = element.find('input');

    input.val('text').trigger('input');
    $timeout.flush(); // for the 'debounce' option

    expect($rootScope.filter.text).to.equal('text');

    element.find('.esn-filter-input-clear-btn').click();

    expect($rootScope.filter.text).to.equal('');
    expect(input.val()).to.equal('');
  });

});
