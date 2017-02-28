'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The infiniteList directive', function() {
  var $rootScope, $compile, element;

  function compileDirective(html) {
    element = $compile(html)($rootScope);

    $rootScope.$digest();

    return element;
  }

  function checkGeneratedElement(element, distance, disabled, immediateCheck) {
    var scope = element.find('[infinite-scroll]').isolateScope();

    expect(scope.infiniteScrollDistance).to.equal(distance);
    expect(scope.infiniteScrollDisabled).to.equal(disabled);
    expect(element.contents()[0].attributes.getNamedItem('infinite-scroll-immediate-check').value).to.equal(immediateCheck);
  }

  beforeEach(angular.mock.module('esn.infinite-list'));

  beforeEach(module('jadeTemplates'));

  beforeEach(inject(function(_$compile_, _$rootScope_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
  }));

  it('should fill the isolated scope with values from attribute', function() {
    compileDirective('<infinite-list infinite-scroll-distance="10" infinite-scroll-disabled="true" infinite-scroll-immediate-check="false"><span>Inner Element</span></infinite-list>');

    checkGeneratedElement(element, 10, true, 'false');
  });

  it('should fill the template with default values if no values were defined in the scope', inject(function(INFINITE_LIST_DISTANCE, INFINITE_LIST_DISABLED, INFINITE_LIST_IMMEDIATE_CHECK) {
    compileDirective('<infinite-list scroll-inside-container="true"><span>Inner Element</span></infinite-list>');

    checkGeneratedElement(element, INFINITE_LIST_DISTANCE, INFINITE_LIST_DISABLED, INFINITE_LIST_IMMEDIATE_CHECK + '');
  }));

  it('should expose a isEmpty scope attribute, true when there is no child elements matching the selector', function(done) {
    compileDirective(
      '<infinite-list element-selector=".visible">' +
        '<div class="visible">A</div>' +
        '<div class="visible">B</div>' +
      '</infinite-list>'
    );

    var scope = element.find('[infinite-scroll]').scope();

    expect(!!scope.isEmpty).to.equal(false);

    element.find('.visible').remove();

    // Need to do this to let the 'Mutation' events fly through
    setTimeout(function() {
      $rootScope.$digest();

      expect(!!scope.isEmpty).to.equal(true);

      done();
    }, 0);
  });
});
