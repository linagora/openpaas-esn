'use strict';

/* global chai: false, sinon: false */

var expect = chai.expect;

describe('The infiniteListService service', function() {
  var $rootScope, infiniteListService, INFINITE_LIST_EVENTS;
  var dummyElement = { my: 'element' }, e1, e2;

  beforeEach(angular.mock.module('esn.infinite-list'));

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
