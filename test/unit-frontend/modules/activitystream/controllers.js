'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {

  var self = this;

  describe('activitystreamController', function() {

    beforeEach(function() {
      angular.mock.module('esn.activitystream');
    });

    beforeEach(angular.mock.inject(function($controller, $rootScope) {
      self.rootScope = $rootScope;
      self.scope = $rootScope.$new();
      self.controller = $controller;
    }));

    describe('at instantiation', function() {
      it('should initialize a listener on rootScope', function(done) {
        self.rootScope.$on = function(topic, callback) {
          expect(topic).to.equal('activitystream:userUpdateRequest');
          expect(callback).to.exist;
          done();
        };
        self.controller('activitystreamController', {
          $rootScope: self.rootScope,
          $scope: self.scope
        });
      });
    });

    describe('reset method', function() {
      it('should reset scope variables', function() {
        self.controller('activitystreamController', {
          $rootScope: self.rootScope,
          $scope: self.scope
        });

        self.scope.reset();
        expect(self.scope.restActive).to.deep.equal({});
        expect(self.scope.updateMessagesActive).to.be.false;
        expect(self.scope.threads).to.deep.equal([]);
        expect(self.scope.mostRecentActivityID).to.be.null;
      });
    });

    describe('loadMoreElements method', function() {

      beforeEach(function() {
        self.usSpinnerService = {};
        self.usSpinnerService.spin = function() {};
        self.usSpinnerService.stop = function() {};

        self.loadCount = 0;
        self.aggregatorService = function() {
          return {
            loadMoreElements: function(callback) {
              self.loadCount++;
              callback(null, [{thread1: {}}, {thread2: {}}, {thread3: {}}]);
            },
            endOfStream: false
          };
        };

        self.alert = function() {};
        self.controller('activitystreamController', {
          $rootScope: self.rootScope,
          $scope: self.scope,
          activitystreamAggregatorCreator: self.aggregatorService,
          usSpinnerService: self.usSpinnerService,
          alert: self.alert
        });
      });

      it('should not call the aggregator loadMoreElements method if a rest request is active', function() {
        self.loadCount = 0;
        self.scope.updateMessagesActive = true;
        self.scope.streams = [{activity_stream: {uuid: '0987654321'}}];
        self.scope.loadMoreElements();
        expect(self.loadCount).to.equal(0);
      });

      it('should not call the aggregator loadMoreElements method if the activity stream uuid is not set', function() {
        self.loadCount = 0;
        self.scope.restActive = {};
        self.scope.streams = null;
        self.scope.loadMoreElements();
        expect(self.loadCount).to.equal(0);
      });

      it('should call the aggregator loadMoreElements method', function() {
        self.loadCount = 0;
        self.scope.restActive = {};
        self.scope.streams = [{activity_stream: {uuid: '0987654321'}}];
        self.scope.loadMoreElements();
        expect(self.loadCount).to.equal(1);
      });

      describe('aggregator loadMoreElements() response', function() {
        it('should handle error', function() {
          var id = '0987654321';
          var errorMsg = 'An Error';
          self.aggregatorService = function() {
            return {
              loadMoreElements: function(callback) {
                self.loadCount++;
                callback(errorMsg, [{thread1: {}}]);
              },
              endOfStream: false
            };
          };
          self.thrownError = null;
          self.spinnerStopped = false;
          self.usSpinnerService.stop = function(id) {
            expect(id).to.equal('activityStreamSpinner');
            self.spinnerStopped = true;
          };

          angular.mock.inject(function($controller) {
            $controller('activitystreamController', {
              $scope: self.scope,
              activitystreamAggregatorCreator: self.aggregatorService,
              usSpinnerService: self.usSpinnerService
            });
          });

          self.loadCount = 0;
          self.scope.updateMessagesActive = false;
          self.scope.streams = [{activity_stream: {uuid: id}}];
          self.scope.displayError = function(err) {
            self.thrownError = err;
          };

          self.scope.loadMoreElements();
          expect(self.thrownError).to.contain(errorMsg);
          expect(self.loadCount).to.equal(1);
          expect(self.scope.updateMessagesActive).to.be.false;
          expect(self.spinnerStopped).to.be.true;
          expect(self.scope.threads.length).to.equal(0);
        });

        it('should handle success', function() {
          self.spinnerStopped = false;
          self.usSpinnerService.stop = function(id) {
            expect(id).to.equal('activityStreamSpinner');
            self.spinnerStopped = true;
          };

          self.loadCount = 0;
          self.scope.updateMessagesActive = false;
          self.scope.streams = [{activity_stream: {uuid: '0987654321'}}];
          self.thrownError = null;
          self.scope.displayError = function(err) {
            self.thrownError = err;
          };
          self.scope.threads = [];

          self.scope.loadMoreElements();
          expect(self.thrownError).to.be.null;
          expect(self.loadCount).to.equal(1);
          expect(self.scope.updateMessagesActive).to.be.false;
          expect(self.spinnerStopped).to.be.true;
          expect(self.scope.threads.length).to.equal(3);
        });
      });

      it('should start and stop the spinner service', function(done) {
        var isSpinning = false;
        self.usSpinnerService.spin = function(id) {
          expect(id).to.equal('activityStreamSpinner');
          isSpinning = true;
        };
        self.usSpinnerService.stop = function(id) {
          expect(isSpinning).to.be.true;
          expect(id).to.equal('activityStreamSpinner');
          done();
        };

        self.scope.streams = [{activity_stream: {uuid: '123'}}];
        self.scope.loadMoreElements();
      });

    });

    describe('getStreamUpdates() method', function() {
      beforeEach(function() {
        self.usSpinnerService = {};
        self.usSpinnerService.spin = function() {};
        self.usSpinnerService.stop = function() {};
        self.aggregatorService = function() {};
        self.activityStreamUpdates = function() {};
        self.alert = function() {};
      });

      describe('when a rest query is active for current stream', function() {
        beforeEach(function() {
          self.activityStreamUpdates = function() {
            throw new Error('I should not be called');
          };
          self.controller('activitystreamController', {
            $scope: self.scope,
            activitystreamAggregatorCreator: self.aggregatorService,
            usSpinnerService: self.usSpinnerService,
            alert: self.alert,
            activityStreamUpdates: self.activityStreamUpdates
          });
          self.scope.restActive['123'] = true;
        });
        it('should not call the activityStreamUpdates service', function() {
          self.scope.getStreamUpdates('123');
        });
      });

      describe('when no rest query is active', function() {
        it('should call the activityStreamUpdates service and set scope restActive to true', function(done) {
          self.activityStreamUpdates = function() {
            expect(self.scope.restActive['123']).to.be.true;
            done();
          };
          self.controller('activitystreamController', {
            $scope: self.scope,
            activitystreamAggregatorCreator: self.aggregatorService,
            usSpinnerService: self.usSpinnerService,
            alert: self.alert,
            activityStreamUpdates: self.activityStreamUpdates
          });

          self.scope.getStreamUpdates('123');
        });
        it('should finally set the restActive to false', function(done) {
          self.activityStreamUpdates = function() {
            return {
              then: function() {
                return {
                  finally: function(callback) {
                    callback();
                    expect(self.scope.restActive['123']).to.be.false;
                    done();
                  }
                };
              }
            };
          };
          self.controller('activitystreamController', {
            $scope: self.scope,
            activitystreamAggregatorCreator: self.aggregatorService,
            usSpinnerService: self.usSpinnerService,
            alert: self.alert,
            activityStreamUpdates: self.activityStreamUpdates
          });

          self.scope.getStreamUpdates('123');
        });
      });

    });

    describe('filterMessagesInSelectedStream() method', function() {
      beforeEach(function() {
        self.activityStreamHelper = {};
        self.controller('activitystreamController', {
          $rootScope: self.rootScope,
          $scope: self.scope,
          activitystreamHelper: self.activityStreamHelper
        });
      });

      it('should return true if scope.selectedStream is falsy', function() {
        self.scope.selectedStream = false;
        expect(self.scope.filterMessagesInSelectedStream()).to.be.true;
      });

      it('should return the result of activityStreamHelper#messageIsSharedInStreams if scope.selectedStream exists', function() {
        self.scope.selectedStream = 'selectedStream';
        var testThread = 'testThread';
        var result = 'testResult';
        self.activityStreamHelper.messageIsSharedInStreams = function(thread, arrayOfStream) {
          expect(thread).to.equal(testThread);
          expect(arrayOfStream).to.deep.equal([self.scope.selectedStream]);
          return result;
        };
        expect(self.scope.filterMessagesInSelectedStream(testThread)).to.equal(result);
      });
    });

  });

});
