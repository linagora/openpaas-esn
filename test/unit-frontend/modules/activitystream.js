'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {
  describe('activitystreamAggregator service', function() {
    beforeEach(function() {
      var filteredcursorInstance = {
        nextItems: function() {},
        endOfStream: false
      };
      this.asAPI = { get: function() {} };
      this.asDecorator = function(callback) { return callback; };
      this.restcursor = function() {
        return {
          nextItems: function() {},
          endOfStream: false
        };
      };
      this.filteredcursorInstance = filteredcursorInstance;
      this.filteredcursor = function() {
        return filteredcursorInstance;
      };
      this.asfilter = function() {
        return {
          filter: function() {return true;}
        };
      };

      var self = this;

      angular.mock.module('esn.activitystream');
      angular.mock.module(function($provide) {
        $provide.value('activitystreamAPI', self.asAPI);
        $provide.value('activitystreamMessageDecorator', self.asDecorator);
        $provide.value('restcursor', self.restcursor);
        $provide.value('filteredcursor', self.filteredcursor);
        $provide.value('activitystreamFilter', self.asfilter);
      });
    });

    beforeEach(inject(function(activitystreamAggregator, $rootScope, $q) {
      this.agg = activitystreamAggregator;
      this.$rootScope = $rootScope;
      this.$q = $q;
    }));

    it('should be a function', function() {
      expect(this.agg).to.be.a.function;
    });

    it('should return an object having a endOfStream property', function() {
      var instance = this.agg('ID1', 30);
      expect(instance).to.have.property('endOfStream');
    });

    it('should return an object having a loadMoreElements method', function() {
      var instance = this.agg('ID1', 30);
      expect(instance).to.respondTo('loadMoreElements');
    });

    describe('endOfStream property', function() {
      it('should return the endofstream property of the associated filteredcursor', function() {
        var instance = this.agg('ID1', 30);
        expect(instance.endOfStream).to.be.false;
        this.filteredcursorInstance.endOfStream = true;
        expect(instance.endOfStream).to.be.true;
      });
    });

    describe('loadMoreElements method', function() {
      it('should call the nextItems method of the associated filteredcursor', function(done) {
        var instance = this.agg('ID1', 30);
        this.filteredcursorInstance.nextItems = function() {done();};
        instance.loadMoreElements();
      });
    });
  });
  describe('activitystreamMessageDecorator service', function() {

    beforeEach(function() {
      this.msgAPI = {
        get: function() {}
      };

      var self = this;

      angular.mock.module('esn.activitystream');
      angular.mock.module(function($provide) {
        $provide.value('messageAPI', self.msgAPI);
      });
    });

    beforeEach(inject(function(activitystreamMessageDecorator, $rootScope, $q) {
      this.decorator = activitystreamMessageDecorator;
      this.$rootScope = $rootScope;
      this.$q = $q;
    }));

    it('should be a function', function() {
      expect(this.decorator).to.be.a.function;
    });

    it('should return a function', function() {
      var instance = this.decorator(function() {});
      expect(instance).to.be.a.function;
    });

    it('should forward any error', function(done) {
      var instance = this.decorator(function(err) {
        expect(err).to.equal('ERROR');
        done();
      });
      instance('ERROR');
    });

    it('should call messageAPI.get with according ids', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }}
      ];
      this.msgAPI.get = function(options) {
        expect(options).to.deep.equal({'ids[]': ['ID5', 'ID2']});
        done();
      };
      var instance = this.decorator(function() { });
      instance(null, tl);
    });

    it('should not call messageAPI.get if the array of ids is empty', function() {
      var msgAPIcalled = false;
      this.msgAPI.get = function(options) {
        msgAPIcalled = true;
      };
      var instance = this.decorator(function() { });
      instance(null, []);
      expect(msgAPIcalled).to.be.false;
    });

    it('should forward messageAPI.get error', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }}
      ];
      var d = this.$q.defer();
      d.reject({data: 'ERROR'});
      this.msgAPI.get = function(options) {
        return d.promise;
      };
      var instance = this.decorator(function(err) {
        expect(err).to.equal('ERROR');
        done();
      });
      instance(null, tl);
      this.$rootScope.$digest();
    });

    it('should return an error if some messages cannot be fetched', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }}
      ];

      var msgResp = [
        {_id: 'ID5', objectType: 'whatsup' },
        {error: 404, message: 'Not found', details: 'message ID2 could not be found'}
      ];
      var d = this.$q.defer();
      d.resolve({data: msgResp});
      this.msgAPI.get = function(options) {
        return d.promise;
      };
      var instance = this.decorator(function(err) {
        expect(err.code).to.equal(400);
        expect(err.message).to.equal('message download failed');
        expect(err.details).to.be.an.array;
        expect(err.details).to.have.length(1);
        done();
      });
      instance(null, tl);
      this.$rootScope.$digest();
    });

    it('should return the decorated timeline object', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }}
      ];

      var msgResp = [
        {_id: 'ID5', objectType: 'whatsup', content: 'yolo' },
        {_id: 'ID2', objectType: 'whatsup', content: 'lgtm' }
      ];
      var d = this.$q.defer();
      d.resolve({data: msgResp});
      this.msgAPI.get = function(options) {
        return d.promise;
      };
      var instance = this.decorator(function(err, response) {
        expect(response).to.deep.equal([
          {object: {_id: 'ID5', objectType: 'whatsup', content: 'yolo' }},
          {object: {_id: 'ID2', objectType: 'whatsup', content: 'lgtm' }}
        ]);
        done();
      });
      instance(null, tl);
      this.$rootScope.$digest();
    });


  });

  describe('activitystreamAPI service', function() {

    beforeEach(function() {
      angular.mock.module('esn.activitystream');
    });
    beforeEach(inject(function(activitystreamAPI, $httpBackend) {
      this.api = activitystreamAPI;
      this.$httpBackend = $httpBackend;
    }));

    describe('get method', function() {
      it('should exist', function() {
        expect(this.api).to.respondTo('get');
      });

      it('should send a request GET /activitystreams/:uuid', function() {
        this.$httpBackend.expectGET('/activitystreams/test').respond([]);
        this.api.get('test');
        this.$httpBackend.flush();
      });

      it('should send a request GET /activitystreams/:uuid, allowing passing some options', function() {
        this.$httpBackend.expectGET('/activitystreams/test?before=someID&limit=30').respond([]);
        this.api.get('test', {before: 'someID', limit: 30});
        this.$httpBackend.flush();
      });
    });
  });

  describe('activitystreamFilter service', function() {

    beforeEach(function() {
      angular.mock.module('esn.activitystream');
    });
    beforeEach(inject(function(activitystreamFilter) {
      this.filter = activitystreamFilter;
    }));

    it('should be a function', function() {
      expect(this.filter).to.be.a.function;
    });

    it('should return an object with filter, addToSentList and addToRemovedList methods', function() {
      var f = this.filter();
      expect(f).to.respondTo('filter');
      expect(f).to.respondTo('addToSentList');
      expect(f).to.respondTo('addToRemovedList');
    });

    describe('filter method', function() {
      it('should respond true for a new timeline entry', function() {
        var f = this.filter();
        var tle = {
          verb: 'post',
          object: {
            _id: 'ID1'
          }
        };
        expect(f.filter(tle)).to.be.true;
      });

      it('should respond false for a new timeline entry having the verb remove', function() {
        var f = this.filter();
        var tle = {
          verb: 'remove',
          object: {
            _id: 'ID1'
          }
        };
        expect(f.filter(tle)).to.be.false;
      });

      it('should respond false for a new timeline entry it already knows', function() {
        var f = this.filter();
        var tle = {
          verb: 'post',
          object: {
            _id: 'ID1'
          }
        };
        f.filter(tle);
        expect(f.filter(tle)).to.be.false;
      });

      it('should respond false for a new timeline entry it already knows and that was "remove"d', function() {
        var f = this.filter();
        var tle = {
          verb: 'post',
          object: {
            _id: 'ID1'
          }
        };
        var tle2 = {
          verb: 'remove',
          object: {
            _id: 'ID1'
          }
        };
        f.filter(tle2);
        expect(f.filter(tle)).to.be.false;
      });

      describe('comments support', function() {
        it('should respond true for a new comment', function() {
          var f = this.filter();
          var cmt = {
            verb: 'post',
            object: { _id: 'comment1' },
            inReplyTo: [{_id: 'message1'}]
          };
          expect(f.filter(cmt)).to.be.true;
        });
        it('should respond false for a new comment when a comment has already been posted for the same parent message', function() {
          var f = this.filter();
          var cmt = {
            verb: 'post',
            object: { _id: 'comment1' },
            inReplyTo: [{_id: 'message1'}]
          };
          var cmt2 = {
            verb: 'post',
            object: { _id: 'comment2' },
            inReplyTo: [{_id: 'message1'}]
          };
          f.filter(cmt);
          expect(f.filter(cmt2)).to.be.false;
        });
        it('should respond false for a new comment when the parent message has already been posted', function() {
          var f = this.filter();
          var cmt = {
            verb: 'post',
            object: { _id: 'comment1' },
            inReplyTo: [{_id: 'message1'}]
          };
          var parent = {
            verb: 'post',
            object: { _id: 'message1' }
          };
          f.filter(parent);
          expect(f.filter(cmt)).to.be.false;
        });
        it('should respond false for a new comment when the parent message has been removed', function() {
          var f = this.filter();
          var cmt = {
            verb: 'post',
            object: { _id: 'comment1' },
            inReplyTo: [{_id: 'message1'}]
          };
          var parent = {
            verb: 'remove',
            object: { _id: 'message1' }
          };
          f.filter(parent);
          expect(f.filter(cmt)).to.be.false;
        });
      });
    });

  });

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
        this.session = {
          domain: {
            activity_stream: {
              uuid: 'ID'
            }
          }
        };
        this.alert = function(msgObject) {};
        $controller('activitystreamController', {
          $scope: this.scope,
          session: this.session,
          activitystreamAggregator: this.aggregatorService,
          usSpinnerService: this.usSpinnerService,
          alert: this.alert
        });
      }));

      it('should not call the aggregator loadMoreElements method if a rest request is active', function() {
        this.loadCount = 0;
        this.scope.restActive = true;
        this.scope.loadMoreElements();
        expect(this.loadCount).to.equal(0);
      });

      it('should call the aggregator loadMoreElements method', function() {
        this.loadCount = 0;
        this.scope.restActive = false;
        this.scope.loadMoreElements();
        expect(this.loadCount).to.equal(1);
      });

      it('should handle aggregator loadMoreElements method responding an error', function() {
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
            session: this.session,
            activitystreamAggregator: this.aggregatorService,
            usSpinnerService: this.usSpinnerService
          });
        });

        this.loadCount = 0;
        this.scope.restActive = false;
        this.scope.displayError = function(err) {
          self.thrownError = err;
        };

        this.scope.loadMoreElements();
        expect(this.thrownError).to.contain(errorMsg);
        expect(this.loadCount).to.equal(1);
        expect(this.scope.restActive).to.be.false;
        expect(this.spinnerStopped).to.be.true;
        expect(this.scope.threads.length).to.equal(0);
      });

      it('should handle aggregator loadMoreElements method returning elements', function() {
        this.spinnerStopped = false;
        var self = this;
        this.usSpinnerService.stop = function(id) {
          expect(id).to.equal('activityStreamSpinner');
          self.spinnerStopped = true;
        };

        this.loadCount = 0;
        this.scope.restActive = false;
        this.thrownError = null;
        this.scope.displayError = function(err) {
          self.thrownError = err;
        };
        this.scope.threads = [];

        this.scope.loadMoreElements();
        expect(this.thrownError).to.be.null;
        expect(this.loadCount).to.equal(1);
        expect(this.scope.restActive).to.be.false;
        expect(this.spinnerStopped).to.be.true;
        expect(this.scope.threads.length).to.equal(3);
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

        this.scope.loadMoreElements();
      });

    });

  });

});
