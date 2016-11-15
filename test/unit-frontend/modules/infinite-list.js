'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The Infinite-list Angular module', function() {

  beforeEach(angular.mock.module('esn.infinite-list'));

  describe('infinite-list directive', function() {

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

    describe('The controller', function() {

      it('should expose a getElementsCount function, couting the DOM elements inside the infinite list', function() {
        compileDirective(
          '<infinite-list element-selector=".visible">' +
            '<div class="visible a">A</div>' +
            '<div class="visible b">B</div>' +
            '<div class="visible c">C</div>' +
          '</infinite-list>'
        );

        expect(element.controller('infiniteList').getElementsCount()).to.equal(3);

        element.find('.visible.c').remove();

        expect(element.controller('infiniteList').getElementsCount()).to.equal(2);
      });

    });

  });

  describe('The infiniteListService factory', function() {

    var $rootScope, infiniteListService, INFINITE_LIST_EVENTS;
    var dummyElement = { my: 'element' }, e1, e2;

    beforeEach(inject(function(_$rootScope_, _infiniteListService_, _INFINITE_LIST_EVENTS_) {
      e1 = { e: '1' };
      e2 = { e: '2' };

      $rootScope = _$rootScope_;
      infiniteListService = _infiniteListService_;
      INFINITE_LIST_EVENTS = _INFINITE_LIST_EVENTS_;
    }));

    describe('The loadMoreElements function', function() {

      it('should broadcast INFINITE_LIST_EVENTS.LOAD_MORE_ELEMENTS event', function(done) {
        $rootScope.$on(INFINITE_LIST_EVENTS.LOAD_MORE_ELEMENTS, function() {
          done();
        });

        infiniteListService.loadMoreElements();
      });

    });

    describe('The addElement function', function() {

      it('should broadcast INFINITE_LIST_EVENTS.ADD_ELEMENTS event, passing the element', function(done) {
        $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
          expect(elements).to.deep.equal([dummyElement]);

          done();
        });

        infiniteListService.addElement(dummyElement);
      });

    });

    describe('The addElements function', function() {

      it('should broadcast INFINITE_LIST_EVENTS.ADD_ELEMENTS event, passing the elements', function(done) {
        $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
          expect(elements).to.deep.equal([e1, e2]);

          done();
        });

        infiniteListService.addElements([e1, e2]);
      });

    });

    describe('The removeElement function', function() {

      it('should broadcast INFINITE_LIST_EVENTS.REMOVE_ELEMENTS event, passing the element', function(done) {
        $rootScope.$on(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, function(event, elements) {
          expect(elements).to.deep.equal([dummyElement]);

          done();
        });

        infiniteListService.removeElement(dummyElement);
      });

    });

    describe('The removeElements function', function() {

      it('should broadcast INFINITE_LIST_EVENTS.REMOVE_ELEMENTS event, passing the elements', function(done) {
        $rootScope.$on(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, function(event, elements) {
          expect(elements).to.deep.equal([e1, e2]);

          done();
        });

        infiniteListService.removeElements([e1, e2]);
      });

    });

    describe('The actionRemovingElement function', function() {

      it('should broadcast INFINITE_LIST_EVENTS.REMOVE_ELEMENTS event, and execute the action', function(done) {
        var eventHandler = sinon.spy(function(event, elements) {
          expect(elements).to.deep.equal([dummyElement]);
        });
        var action = sinon.spy(function() {
          expect(eventHandler).to.have.been.calledWith();

          done();
        });

        $rootScope.$on(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, eventHandler);

        infiniteListService.actionRemovingElement(action, dummyElement);
      });

      it('should broadcast INFINITE_LIST_EVENTS.REMOVE_ELEMENTS event, execute the action and add the element back if the action fails', function(done) {
        var eventHandler = sinon.spy(function(event, elements) {
          expect(elements).to.deep.equal([dummyElement]);
        });

        $rootScope.$on(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, eventHandler);
        $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
          expect(eventHandler).to.have.been.calledWith();
          expect(elements).to.deep.equal([dummyElement]);

          done();
        });

        infiniteListService.actionRemovingElement(function() {
          return $q.reject();
        }, dummyElement);
        $rootScope.$digest();
      });

    });

    describe('The actionRemovingElements function', function() {

      it('should broadcast INFINITE_LIST_EVENTS.REMOVE_ELEMENTS event, and execute the action', function(done) {
        var eventHandler = sinon.spy(function(event, elements) {
          expect(elements).to.deep.equal([e1, e2]);
        });
        var action = sinon.spy(function() {
          expect(eventHandler).to.have.been.calledWith();

          done();
        });

        $rootScope.$on(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, eventHandler);

        infiniteListService.actionRemovingElements(action, [e1, e2]);
      });

      it('should broadcast INFINITE_LIST_EVENTS.REMOVE_ELEMENTS event, execute the action and add all elements back if no callback given', function(done) {
        var eventHandler = sinon.spy(function(event, elements) {
          expect(elements).to.deep.equal([e1, e2]);
        });

        $rootScope.$on(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, eventHandler);
        $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
          expect(eventHandler).to.have.been.calledWith();
          expect(elements).to.deep.equal([e1, e2]);

          done();
        });

        infiniteListService.actionRemovingElements(function() {
          return $q.reject();
        }, [e1, e2]);
        $rootScope.$digest();
      });

      it('should broadcast INFINITE_LIST_EVENTS.REMOVE_ELEMENTS event, execute the action and add some elements back if a callback given', function(done) {
        var eventHandler = sinon.spy(function(event, elements) {
          expect(elements).to.deep.equal([e1, e2]);
        });

        $rootScope.$on(INFINITE_LIST_EVENTS.REMOVE_ELEMENTS, eventHandler);
        $rootScope.$on(INFINITE_LIST_EVENTS.ADD_ELEMENTS, function(event, elements) {
          expect(eventHandler).to.have.been.calledWith();
          expect(elements).to.deep.equal([e2]);

          done();
        });

        infiniteListService.actionRemovingElements(function() {
          return $q.reject('');
        }, [e1, e2], function(err, elements) {
          expect(err).to.equal('');
          expect(elements).to.deep.equal([e1, e2]);

          return [e2]; // Only e2 should be added back to the list
        });
        $rootScope.$digest();
      });

    });

  });

});
