'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.beforeunload Angular module', function() {

  describe('The run block', function() {

    var backgroundProcessorServiceMock, windowMock;

    beforeEach(function() {
      backgroundProcessorServiceMock = {};
      windowMock = {};

      angular.mock.module('esn.beforeunload', function($provide) {
        $provide.value('backgroundProcessorService', backgroundProcessorServiceMock);
        $provide.value('$window', windowMock);
      });
    });

    it('should handle beforeunload event to return a warning message when there is background task', function(done) {
      backgroundProcessorServiceMock.tasks = ['a task'];

      windowMock.addEventListener = function(eventName, handler) {
        expect(eventName).to.equal('beforeunload');

        var event = {};

        expect(handler(event)).to.match(/Are you sure want to leave OpenPaas\?/);
        expect(event.returnValue).to.match(/Are you sure want to leave OpenPaas\?/);

        done();
      };

      angular.mock.inject();
    });

    it('should handle beforeunload event to return undefined when there is no background task', function(done) {
      backgroundProcessorServiceMock.tasks = [];

      windowMock.addEventListener = function(eventName, handler) {
        expect(eventName).to.equal('beforeunload');

        var event = {};

        expect(handler(event)).to.not.be.defined;
        expect(event.returnValue).to.not.be.defined;

        done();
      };

      angular.mock.inject();
    });

  });

});
