'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {
  describe('activitystreamController', function() {

    beforeEach(function() {
      angular.mock.module('esn.activitystream');
    });

    describe('loadMoreElements method', function() {

      beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.usSpinnerService = {};
        this.usSpinnerService.spin = function(id) {};
        this.usSpinnerService.stop = function(id) {};

        this.loadCount = 0;
        var self = this;
        this.aggregatorService = function(id, limit) {
          return {
            loadMoreElements: function(callback) {
              self.loadCount++;
              callback(null, [{thread1: {}},{thread2: {}},{thread3: {}}]);
            },
            endOfStream: false
          };
        };

        this.$controller = $controller;
        this.scope = $rootScope.$new();
        this.alert = function(msgObject) {};
        $controller('activitystreamController', {
          $rootScope: $rootScope,
          $scope: this.scope,
          activitystreamAggregatorCreator: this.aggregatorService,
          usSpinnerService: this.usSpinnerService,
          alert: this.alert
        });
      }));

      it('should not call the aggregator loadMoreElements method if a rest request is active', function() {
        this.loadCount = 0;
        this.scope.updateMessagesActive = true;
        this.scope.streams = [{activity_stream: {uuid: '0987654321'}}];
        this.scope.loadMoreElements();
        expect(this.loadCount).to.equal(0);
      });

      it('should not call the aggregator loadMoreElements method if the activity stream uuid is not set', function() {
        this.loadCount = 0;
        this.scope.restActive = {};
        this.scope.streams = null;
        this.scope.loadMoreElements();
        expect(this.loadCount).to.equal(0);
      });

      it('should call the aggregator loadMoreElements method', function() {
        this.loadCount = 0;
        this.scope.restActive = {};
        this.scope.streams = [{activity_stream: {uuid: '0987654321'}}];
        this.scope.loadMoreElements();
        expect(this.loadCount).to.equal(1);
      });

      describe('aggregator loadMoreElements() response', function() {
        it('should handle error', function() {
          var id = '0987654321';
          var self = this;
          var errorMsg = 'An Error';
          this.aggregatorService = function(id, limit) {
            return {
              loadMoreElements: function(callback) {
                self.loadCount++;
                callback(errorMsg, [{thread1: {}}]);
              },
              endOfStream: false
            };
          };
          this.thrownError = null;
          this.spinnerStopped = false;
          this.usSpinnerService.stop = function(id) {
            expect(id).to.equal('activityStreamSpinner');
            self.spinnerStopped = true;
          };

          angular.mock.inject(function($controller) {
            $controller('activitystreamController', {
              $scope: this.scope,
              activitystreamAggregatorCreator: this.aggregatorService,
              usSpinnerService: this.usSpinnerService
            });
          });

          this.loadCount = 0;
          this.scope.updateMessagesActive = false;
          this.scope.streams = [{activity_stream: {uuid: id}}];
          this.scope.displayError = function(err) {
            self.thrownError = err;
          };

          this.scope.loadMoreElements();
          expect(this.thrownError).to.contain(errorMsg);
          expect(this.loadCount).to.equal(1);
          expect(this.scope.updateMessagesActive).to.be.false;
          expect(this.spinnerStopped).to.be.true;
          expect(this.scope.threads.length).to.equal(0);
        });

        it('should handle success', function() {
          this.spinnerStopped = false;
          var self = this;
          this.usSpinnerService.stop = function(id) {
            expect(id).to.equal('activityStreamSpinner');
            self.spinnerStopped = true;
          };

          this.loadCount = 0;
          this.scope.updateMessagesActive = false;
          this.scope.streams = [{activity_stream: {uuid: '0987654321'}}];
          this.thrownError = null;
          this.scope.displayError = function(err) {
            self.thrownError = err;
          };
          this.scope.threads = [];

          this.scope.loadMoreElements();
          expect(this.thrownError).to.be.null;
          expect(this.loadCount).to.equal(1);
          expect(this.scope.updateMessagesActive).to.be.false;
          expect(this.spinnerStopped).to.be.true;
          expect(this.scope.threads.length).to.equal(3);
        });
      });

      it('should start and stop the spinner service', function(done) {
        var isSpinning = false;
        this.usSpinnerService.spin = function(id) {
          expect(id).to.equal('activityStreamSpinner');
          isSpinning = true;
        };
        this.usSpinnerService.stop = function(id) {
          expect(isSpinning).to.be.true;
          expect(id).to.equal('activityStreamSpinner');
          done();
        };

        this.scope.streams = [{activity_stream: {uuid: '123'}}];
        this.scope.loadMoreElements();
      });

    });

    describe('getStreamUpdates() method', function() {
      beforeEach(angular.mock.inject(function($controller, $rootScope) {
        this.usSpinnerService = {};
        this.usSpinnerService.spin = function(id) {};
        this.usSpinnerService.stop = function(id) {};
        this.aggregatorService = function(id, limit) {};
        this.activityStreamUpdates = function() {};
        this.$controller = $controller;
        this.scope = $rootScope.$new();
        this.alert = function(msgObject) {};

      }));

      describe('when a rest query is active for current stream', function() {
        beforeEach(function() {
          this.activityStreamUpdates = function() {
            throw new Error('I should not be called');
          };
          this.$controller('activitystreamController', {
            $scope: this.scope,
            activitystreamAggregatorCreator: this.aggregatorService,
            usSpinnerService: this.usSpinnerService,
            alert: this.alert,
            activityStreamUpdates: this.activityStreamUpdates
          });
          this.scope.restActive['123'] = true;
        });
        it('should not call the activityStreamUpdates service', function() {
          this.scope.getStreamUpdates('123');
        });
      });

      describe('when no rest query is active', function() {
        it('should call the activityStreamUpdates service and set scope restActive to true', function(done) {
          var self = this;
          this.activityStreamUpdates = function() {
            expect(self.scope.restActive['123']).to.be.true;
            done();
          };
          this.$controller('activitystreamController', {
            $scope: this.scope,
            activitystreamAggregatorCreator: this.aggregatorService,
            usSpinnerService: this.usSpinnerService,
            alert: this.alert,
            activityStreamUpdates: this.activityStreamUpdates
          });

          this.scope.getStreamUpdates('123');
        });
        it('should finally set the restActive to false', function(done) {
          var self = this;
          this.activityStreamUpdates = function() {
            return {
              then: function() {
                return {
                  'finally': function(callback) {
                    callback();
                    expect(self.scope.restActive['123']).to.be.false;
                    done();
                  }
                };
              }
            };
          };
          this.$controller('activitystreamController', {
            $scope: this.scope,
            activitystreamAggregatorCreator: this.aggregatorService,
            usSpinnerService: this.usSpinnerService,
            alert: this.alert,
            activityStreamUpdates: this.activityStreamUpdates
          });

          this.scope.getStreamUpdates('123');
        });
      });

    });

  });


});
