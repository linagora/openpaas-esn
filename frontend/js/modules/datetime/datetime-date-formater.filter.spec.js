'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnDatetime filter', function() {
  var $rootScope, $compile;

  beforeEach(function() {
    module('esn.datetime');
  });

  beforeEach(inject(function(_$rootScope_, _$compile_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
  }));

  function initDirective(html) {
    var scope = $rootScope.$new();
    var element = $compile(html)(scope);

    scope.$digest();

    return element;
  }

  it('should return formatted date in template', function() {
    var element = initDirective('<p>{{ "6/5/17" | esnDatetime:"mediumDate" }}</p>');

    expect(element.text()).to.equal('Jun 5, 2017');
  });
});
