'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnDatePicker component', function() {
  var $rootScope, $compile, moment, form;

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
        '<esn-date-picker ng-model="model" ng-change="onChange()" options="{twelvehour: false}" label="Time" custom-attributes="{\'cal-date-to-moment\': \'cal-date-to-moment\'}"/>' +
      '</form>'
    )(scope);

    scope.$digest();
    form = scope.form;

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

  it('should re-validate the input after change', function() {
    var scope = $rootScope.$new();
    var initialMoment = moment();

    scope.model = 'A Random Invalid String';

    var element = initComponent(scope);

    form.date.$setViewValue('A Random Invalid String');
    scope.$digest();
    initialMoment.set({ second: 0, millisecond: 0 });
    scope.model = initialMoment;

    $rootScope.$digest();

    expect(element.find('input[ng-model="$ctrl.uiValue"]')[0].className.split(/\s+/)).to.contain('ng-valid');
    expect(element.find('input[ng-model="$ctrl.uiValue"]')[0].value).to.equal(scope.model.toString());
  });
});
