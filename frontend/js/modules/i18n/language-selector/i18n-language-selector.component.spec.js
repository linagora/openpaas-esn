'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esnI18esnI18nLanguageSelector component', function() {
  var $rootScope, $compile;

  beforeEach(function() {
    module('jadeTemplates');
    module('esn.i18n');
  });

  beforeEach(inject(function(
    _$rootScope_,
    _$compile_
  ) {
    $rootScope = _$rootScope_;
    $compile = _$compile_;
  }));

  function initComponent(scope) {
    scope = scope || $rootScope.$new();

    var element = $compile(
      '<form name="form">' +
        '<esn-i18n-language-selector language="lang"/>' +
      '</form>'
    )(scope);

    scope.$digest();

    return element;
  }

  it('should display selected language', function() {
    var scope = $rootScope.$new();

    scope.lang = 'en';

    var element = initComponent(scope);

    expect(element.find('.selected').length).to.equal(1);
    expect(element.find('.selected')[0].innerHTML).to.equal('English');
  });

  it('should set language to the new language when click on a language entry', function() {
    var scope = $rootScope.$new();

    var element = initComponent(scope);

    element.find('button')[1].click();

    expect(element.find('.selected')[0].innerHTML).to.equal('Français');
    expect(scope.lang).to.equal('fr');
    expect(scope.form.$dirty).to.be.true;
  });
});
