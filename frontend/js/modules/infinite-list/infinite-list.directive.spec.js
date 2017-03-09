'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The infiniteList directive', function() {
  var $rootScope, $compile, $interval, infiniteListService, element, INFINITE_LIST_POLLING_INTERVAL;

  function compileDirective(html) {
    element = $compile(html)($rootScope.$new());

    $rootScope.$digest();

    return element;
  }

  function checkGeneratedElement(element, distance, disabled, immediateCheck) {
    var scope = element.find('[infinite-scroll]').isolateScope();

    expect(scope.infiniteScrollDistance).to.equal(distance);
    expect(scope.infiniteScrollDisabled).to.equal(disabled);
    expect(element.contents()[0].attributes.getNamedItem('infinite-scroll-immediate-check').value).to.equal(immediateCheck);
  }

  beforeEach(angular.mock.module('esn.infinite-list', function($provide) {
    $provide.value('infiniteListService', infiniteListService = {
      addElements: sinon.spy()
    });

    $provide.decorator('$interval', function($delegate) {
      var decorator = sinon.spy(function(fn, delay) {
        return $delegate(fn, delay);
      });

      decorator.cancel = sinon.spy($delegate.cancel);
      decorator.flush = sinon.spy($delegate.flush);

      return decorator;
    });
  }));

  beforeEach(module('jadeTemplates'));

  beforeEach(inject(function(_$compile_, _$rootScope_, _$interval_, _INFINITE_LIST_POLLING_INTERVAL_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $interval = _$interval_;
    INFINITE_LIST_POLLING_INTERVAL = _INFINITE_LIST_POLLING_INTERVAL_;
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

  it('should schedule scope.loadRecentItems at a regular interval', function(done) {
    $rootScope.loadRecentItems = done;

    compileDirective('<infinite-list load-recent-items="loadRecentItems()" />');

    $interval.flush(INFINITE_LIST_POLLING_INTERVAL);
  });

  it('should append new elements to the list', function() {
    $rootScope.loadRecentItems = function() {
      return $q.when([{ a: 1 }]);
    };

    compileDirective('<infinite-list load-recent-items="loadRecentItems()" />');

    $interval.flush(INFINITE_LIST_POLLING_INTERVAL);

    expect(infiniteListService.addElements).to.have.been.calledWith([{ a: 1 }]);
  });

  it('should not schedule a $interval if loadRecentItems is not defined', function() {
    compileDirective('<infinite-list />');

    expect($interval).to.have.not.been.calledWith(sinon.match.func, INFINITE_LIST_POLLING_INTERVAL);
  });

});
