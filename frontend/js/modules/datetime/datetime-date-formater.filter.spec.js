'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esnDatetime filter', function() {
  var $rootScope, $compile, esnDatetimeService;

  beforeEach(function() {
    module('esn.datetime');
  });

  beforeEach(inject(function(_$rootScope_, _$compile_, _esnDatetimeService_) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    esnDatetimeService = _esnDatetimeService_;
  }));

  function initDirective(html) {
    var scope = $rootScope.$new();
    var element = $compile(html)(scope);

    scope.$digest();

    return element;
  }

  it('should return formatted date in template', function() {
    esnDatetimeService.format = sinon.spy();

    initDirective('<p>{{ "6/5/17" | esnDatetime:"mediumDate" }}</p>');

    expect(esnDatetimeService.format).to.have.been.calledWith('6/5/17', 'mediumDate');
  });
});
