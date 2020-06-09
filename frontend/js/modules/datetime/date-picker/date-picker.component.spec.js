'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnDatePicker component', function() {
  var $rootScope, $compile, moment;

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.datetime');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$compile_,
    _moment_
  ) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
    moment = _moment_;
  }));

  function initComponent(scope) {
    scope = scope || $rootScope.$new();
    scope.onChange = function() { return true; };
    var element = $compile(
      '<form name="form">' +
        '<esn-date-picker ng-model="model" ng-change="onChange()", options="{twelvehour: false}", label="Time"/>' +
      '</form>'
    )(scope);

    scope.$digest();

    return element;
  }

  it('should display date correctly no matter what time zone', function() {
    var scope = $rootScope.$new();
    var initialMoment = moment();
    initialMoment.set({second: 0, millisecond: 0 });

    scope.model = initialMoment;

    var element = initComponent(scope);
    expect(element.find('input[ng-model="$ctrl.uiValue"]')[0].value).to.equal(scope.model.toString());
  });
});
