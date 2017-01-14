'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The esn.background Angular module', function() {

  beforeEach(angular.mock.module('esn.background'));

  describe('The backgroundProcessorService service', function() {

    var $rootScope, backgroundProcessorService;

    beforeEach(angular.mock.inject(function(_$rootScope_, _backgroundProcessorService_) {
      $rootScope = _$rootScope_;
      backgroundProcessorService = _backgroundProcessorService_;
    }));

    describe('The add fn', function() {

      it('should add task to the task list', function() {
        var task = $q.when();
        backgroundProcessorService.add(task);

        expect(backgroundProcessorService.tasks).to.deep.equal([task]);
      });

      it('should return the task itself', function() {
        var task = $q.when();
        expect(backgroundProcessorService.add(task)).to.equal(task);
      });

      it('should remove task from task list when task is done', function() {
        var task = $q.when();
        backgroundProcessorService.add(task);
        $rootScope.$digest();

        expect(backgroundProcessorService.tasks).to.deep.equal([]);
      });

      it('should remove task from task list when task is failed', function() {
        var task = $q.reject();
        backgroundProcessorService.add(task);
        $rootScope.$digest();

        expect(backgroundProcessorService.tasks).to.deep.equal([]);
      });

    });

  });

  describe('The inBackground service', function() {

    var inBackground, backgroundProcessorService;

    beforeEach(angular.mock.inject(function(_inBackground_, _backgroundProcessorService_) {
      inBackground = _inBackground_;
      backgroundProcessorService = _backgroundProcessorService_;
    }));

    it('should call backgroundProcessorService.add with the right parameters', function() {
      sinon.spy(backgroundProcessorService, 'add');

      var task = $q.when();
      inBackground(task);

      expect(backgroundProcessorService.add).to.have.been.calledOnce;
      expect(backgroundProcessorService.add).to.have.been.calledWith(task);
    });

  });

});
