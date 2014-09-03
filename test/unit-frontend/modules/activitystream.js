'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.activitystream Angular module', function() {
  describe('activitystreamNotification directive', function() {
    beforeEach(function() {
      this.livenotification = {
        of: function(namespace) { this.namespace = namespace; return this; },
        subscribe: function(uuid) { this.uuid = uuid; return this; },
        onNotification: function(callback) {
          callback({
            actor: {_id: 'user1'},
            message: 'a new notification'
          });
        }
      };
      this.asNotificationService = {
        notify: function() {}
      };
      angular.mock.module('esn.activitystream');
      module('jadeTemplates');
    });
  });

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
      expect(this.agg).to.be.a('function');
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
      expect(this.decorator).to.be.a('function');
    });

    it('should return a function', function() {
      var instance = this.decorator(function() {});
      expect(instance).to.be.a('function');
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

    it('should call messageAPI.get with parent message ids when there is a inReplyTo field', function(done) {
      var tl = [
        {object: { _id: 'ID5' }},
        {object: { _id: 'ID2' }, inReplyTo: [{_id: 'ID3'}]}
      ];
      this.msgAPI.get = function(options) {
        expect(options).to.deep.equal({'ids[]': ['ID5', 'ID3']});
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
      expect(this.filter).to.be.a('function');
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
        this.alert = function(msgObject) {};
        $controller('activitystreamController', {
          $scope: this.scope,
          activitystreamAggregator: this.aggregatorService,
          usSpinnerService: this.usSpinnerService,
          alert: this.alert
        });
      }));

      it('should not call the aggregator loadMoreElements method if a rest request is active', function() {
        this.loadCount = 0;
        this.scope.restActive = true;
        this.scope.activitystreamUuid = '0987654321';
        this.scope.loadMoreElements();
        expect(this.loadCount).to.equal(0);
      });

      it('should not call the aggregator loadMoreElements method if the activity stream uuid is not set', function() {
        this.loadCount = 0;
        this.scope.restActive = false;
        this.scope.activitystreamUuid = null;
        this.scope.loadMoreElements();
        expect(this.loadCount).to.equal(0);
      });

      it('should call the aggregator loadMoreElements method', function() {
        this.loadCount = 0;
        this.scope.restActive = false;
        this.scope.activitystreamUuid = '0987654321';
        this.scope.loadMoreElements();
        expect(this.loadCount).to.equal(1);
      });

      describe('aggregator loadMoreElements() response', function() {
        it('should handle error', function() {
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
              activitystreamAggregator: this.aggregatorService,
              usSpinnerService: this.usSpinnerService
            });
          });

          this.loadCount = 0;
          this.scope.restActive = false;
          this.scope.activitystreamUuid = '0987654321';
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

        it('should handle success', function() {
          this.spinnerStopped = false;
          var self = this;
          this.usSpinnerService.stop = function(id) {
            expect(id).to.equal('activityStreamSpinner');
            self.spinnerStopped = true;
          };

          this.loadCount = 0;
          this.scope.restActive = false;
          this.scope.activitystreamUuid = '0987654321';
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

        this.scope.activitystreamUuid = '0987654321';
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

      describe('when a rest query is active', function() {
        beforeEach(function() {
          this.activityStreamUpdates = function() {
            throw new Error('I should not be called');
          };
          this.$controller('activitystreamController', {
            $scope: this.scope,
            activitystreamAggregator: this.aggregatorService,
            usSpinnerService: this.usSpinnerService,
            alert: this.alert,
            activityStreamUpdates: this.activityStreamUpdates
          });
          this.scope.restActive = true;
        });
        it('should not call the activityStreamUpdates service', function() {
          this.scope.getStreamUpdates();
        });
      });

      describe('when no rest query is active', function() {
        it('should call the activityStreamUpdates service and set scope restActive to true', function(done) {
          var self = this;
          this.activityStreamUpdates = function() {
            expect(self.scope.restActive).to.be.true;
            done();
          };
          this.$controller('activitystreamController', {
            $scope: this.scope,
            activitystreamAggregator: this.aggregatorService,
            usSpinnerService: this.usSpinnerService,
            alert: this.alert,
            activityStreamUpdates: this.activityStreamUpdates
          });

          this.scope.getStreamUpdates();
        });
        it('should finally set the restActive to false', function(done) {
          var self = this;
          this.activityStreamUpdates = function() {
            return {
              then: function() {
                return {
                  'finally': function(callback) {
                    callback();
                    expect(self.scope.restActive).to.be.false;
                    done();
                  }
                };
              }
            };
          };
          this.$controller('activitystreamController', {
            $scope: this.scope,
            activitystreamAggregator: this.aggregatorService,
            usSpinnerService: this.usSpinnerService,
            alert: this.alert,
            activityStreamUpdates: this.activityStreamUpdates
          });

          this.scope.getStreamUpdates();
        });
      });

    });

  });

  describe('activityStreamUpdates service', function() {
    beforeEach(function() {
      angular.mock.module('esn.activitystream');
      this.restcursor = function() {
        return {
          nextItems: function() {},
          endOfStream: false
        };
      };
      this.asAPI = { get: function() {} };
      this.messageAPI = { get: function() {} };
    });

    it('must be a function', function() {
      var self = this;
      angular.mock.module(function($provide) {
        $provide.value('activitystreamAPI', self.asAPI);
        $provide.value('messageAPI', self.messageAPI);
        $provide.value('restcursor', self.restcursor);
      });
      inject(function(activityStreamUpdates) {
        expect(activityStreamUpdates).to.be.a('function');
      });
    });

    it('must create a restcursor', function(done) {
      var self = this;
      this.restcursor = function() {
        expect(arguments).to.have.length(3);
        expect(arguments[0]).to.be.a('function');
        expect(arguments[1]).to.be.an.object;
        done();
        return {
          nextItems: function() {},
          endOfStream: false
        };
      };
      angular.mock.module(function($provide) {
        $provide.value('activitystreamAPI', self.asAPI);
        $provide.value('messageAPI', self.messageAPI);
        $provide.value('restcursor', self.restcursor);
      });
      inject(function(activityStreamUpdates) {
        activityStreamUpdates('0987654321', {mostRecentActivityId: 'message1'});
      });
    });

    it('must call cursor.nextItems', function(done) {
      var self = this;
      this.restcursor = function() {
        return {
          nextItems: function() {done();},
          endOfStream: false
        };
      };
      angular.mock.module(function($provide) {
        $provide.value('activitystreamAPI', self.asAPI);
        $provide.value('messageAPI', self.messageAPI);
        $provide.value('restcursor', self.restcursor);
      });
      inject(function(activityStreamUpdates) {
        activityStreamUpdates('0987654321', {mostRecentActivityId: 'message1'});
      });
    });

    describe('provided API', function() {
      it('must use the activitystreamAPI with provided activity stream ID', function(done) {
        var self = this;
        this.restcursor = function(api) {
          api();
          return {
            nextItems: function() {},
            endOfStream: false
          };
        };
        this.asAPI = { get: function() {
         expect(arguments[0]).to.equal('0987654321');
          done();
        }};

        angular.mock.module(function($provide) {
          $provide.value('activitystreamAPI', self.asAPI);
          $provide.value('messageAPI', self.messageAPI);
          $provide.value('restcursor', self.restcursor);
        });
        inject(function(activityStreamUpdates) {
          activityStreamUpdates('0987654321', {mostRecentActivityId: 'message1'});
        });
      });
    });

    describe('on REST call error', function() {
      it('should forward the error', function(done) {
        var self = this;
        this.restcursor = function(api) {
          return {
            nextItems: function(callback) {return callback(new Error('down'));},
            endOfStream: false
          };
        };
        angular.mock.module(function($provide) {
          $provide.value('activitystreamAPI', self.asAPI);
          $provide.value('messageAPI', self.messageAPI);
          $provide.value('restcursor', self.restcursor);
        });
        inject(function(activityStreamUpdates, $rootScope) {
          activityStreamUpdates('0987654321', {mostRecentActivityId: 'message1'}).then(
            function() {done(new Error('I should not be called'));},
            function(err) {done();}
          );
          $rootScope.$digest();
        });
      });
    });

    describe('on REST call success', function() {
      it('should update the scope with the provided timeline entries', function(done) {
        var self = this;
        var entries = [
          {_id: 'tl1', object: {_id: 'msg1'}},
          {_id: 'tl2', object: {_id: 'msg2'}},
          {_id: 'tl3', object: {_id: 'msg3'}},
          {_id: 'tl4', object: {_id: 'msg4'}},
          {_id: 'tl5', object: {_id: 'msg5'}}
        ];
        this.restcursor = function(api) {
          return {
            nextItems: function(callback) { this.endOfStream = true; return callback(null, entries); },
            endOfStream: false
          };
        };

        var scope = { mostRecentActivityId: 'message1', threads: [] };

        angular.mock.module(function($provide) {
          $provide.value('activitystreamAPI', self.asAPI);
          $provide.value('restcursor', self.restcursor);
        });
        inject(function(activityStreamUpdates, $rootScope, $httpBackend, Restangular) {
          Restangular.setFullResponse(true);
          $httpBackend.expectGET('/messages?ids%5B%5D=msg1&ids%5B%5D=msg2&ids%5B%5D=msg3&ids%5B%5D=msg4&ids%5B%5D=msg5')
          .respond([
              {_id: 'msg3', content: 'message msg3'},
              {_id: 'msg1', content: 'message msg1'},
              {_id: 'msg2', content: 'message msg2'},
              {_id: 'msg4', content: 'message msg4'},
              {_id: 'msg5', content: 'message msg5'}
            ]);
          activityStreamUpdates('0987654321', scope).then(
            function() {
              expect(scope.threads).to.have.length(5);
              expect(scope.threads[0]._id).to.equal('msg5');
              expect(scope.threads[1]._id).to.equal('msg4');
              expect(scope.threads[2]._id).to.equal('msg3');
              expect(scope.threads[3]._id).to.equal('msg2');
              expect(scope.threads[4]._id).to.equal('msg1');
              done();
            },
            function(err) {done(new Error('I should not be called'));}
          ).catch (function(err) {
            throw err;
          });
          $httpBackend.flush();
        });
      });

      it('should update the scope, taking care of the elements ordering', function(done) {
        var self = this;
        var entries = [
          {_id: 'tl1', object: {_id: 'msg1'}},
          {_id: 'tl2', object: {_id: 'msg2'}},
          {_id: 'tl3', object: {_id: 'msg3'}},
          {_id: 'tl4', object: {_id: 'msg2'}},
          {_id: 'tl5', object: {_id: 'msg5'}}
        ];
        this.restcursor = function(api) {
          return {
            nextItems: function(callback) { this.endOfStream = true; return callback(null, entries); },
            endOfStream: false
          };
        };

        var scope = {mostRecentActivityId: 'message1', threads: [] };

        angular.mock.module(function($provide) {
          $provide.value('activitystreamAPI', self.asAPI);
          $provide.value('restcursor', self.restcursor);
        });
        inject(function(activityStreamUpdates, $rootScope, $httpBackend, Restangular) {
          Restangular.setFullResponse(true);
          $httpBackend.expectGET('/messages?ids%5B%5D=msg1&ids%5B%5D=msg2&ids%5B%5D=msg3&ids%5B%5D=msg5')
          .respond([
            {_id: 'msg1', contgent: 'message msg1'},
            {_id: 'msg5', contgent: 'message msg5'},
            {_id: 'msg3', contgent: 'message msg3'},
            {_id: 'msg2', contgent: 'message msg2'}
          ]);
          activityStreamUpdates('0987654321', scope).then(
            function() {
              expect(scope.threads).to.have.length(4);
              expect(scope.threads[0]._id).to.equal('msg5');
              expect(scope.threads[1]._id).to.equal('msg2');
              expect(scope.threads[2]._id).to.equal('msg3');
              expect(scope.threads[3]._id).to.equal('msg1');
              done();
            },
            function(err) {done(new Error('I should not be called'));}
          ).catch (function(err) {
            throw err;
          });
          $httpBackend.flush();
        });
      });

      it('should update the scope, fetching parent when the timeline got a inReplyTo', function(done) {
        var self = this;
        var entries = [
          {_id: 'tl1', object: {_id: 'msg1'}},
          {_id: 'tl2', object: {_id: 'msg2'}},
          {_id: 'tl3', object: {_id: 'cmt1'}, inReplyTo: [{_id: 'msg3'}]},
          {_id: 'tl4', object: {_id: 'msg2'}},
          {_id: 'tl5', object: {_id: 'cmt2'}, inReplyTo: [{_id: 'msg3'}]},
          {_id: 'tl6', object: {_id: 'cmt3'}, inReplyTo: [{_id: 'msg1'}]}
        ];
        this.restcursor = function(api) {
          return {
            nextItems: function(callback) { this.endOfStream = true; return callback(null, entries); },
            endOfStream: false
          };
        };

        var scope = {mostRecentActivityId: 'message1', threads: [] };

        angular.mock.module(function($provide) {
          $provide.value('activitystreamAPI', self.asAPI);
          $provide.value('restcursor', self.restcursor);
        });
        inject(function(activityStreamUpdates, $rootScope, $httpBackend, Restangular) {
          Restangular.setFullResponse(true);
          $httpBackend.expectGET('/messages?ids%5B%5D=msg1&ids%5B%5D=msg2&ids%5B%5D=msg3')
          .respond([
            {_id: 'msg1', contgent: 'message msg1'},
            {_id: 'msg3', contgent: 'message msg3'},
            {_id: 'msg2', contgent: 'message msg2'}
          ]);
          activityStreamUpdates('0987654321', scope).then(
            function() {
              expect(scope.threads).to.have.length(3);
              expect(scope.threads[0]._id).to.equal('msg1');
              expect(scope.threads[1]._id).to.equal('msg3');
              expect(scope.threads[2]._id).to.equal('msg2');
              done();
            },
            function(err) {done(new Error('I should not be called'));}
          ).catch (function(err) {
            throw err;
          });
          $httpBackend.flush();
        });
      });


      it('should update the scope, recursively fetching timeline entries per batches of 30', function(done) {
        var self = this;
        var entries1 = [
          {_id: 'tl1', object: {_id: 'msg1'}},
          {_id: 'tl2', object: {_id: 'msg2'}},
          {_id: 'tl3', object: {_id: 'cmt1'}, inReplyTo: [{_id: 'msg3'}]},
          {_id: 'tl4', object: {_id: 'msg2'}},
          {_id: 'tl5', object: {_id: 'cmt2'}, inReplyTo: [{_id: 'msg4'}]},
          {_id: 'tl6', object: {_id: 'msg2'}},
          {_id: 'tl7', object: {_id: 'msg2'}},
          {_id: 'tl8', object: {_id: 'msg2'}},
          {_id: 'tl9', object: {_id: 'msg2'}},
          {_id: 'tl10', object: {_id: 'msg18'}},
          {_id: 'tl11', object: {_id: 'msg2'}},
          {_id: 'tl12', object: {_id: 'msg2'}},
          {_id: 'tl13', object: {_id: 'msg14'}},
          {_id: 'tl14', object: {_id: 'msg2'}},
          {_id: 'tl15', object: {_id: 'msg2'}},
          {_id: 'tl16', object: {_id: 'msg2'}},
          {_id: 'tl17', object: {_id: 'msg1'}},
          {_id: 'tl18', object: {_id: 'msg2'}},
          {_id: 'tl19', object: {_id: 'msg2'}},
          {_id: 'tl20', object: {_id: 'msg2'}},
          {_id: 'tl21', object: {_id: 'msg2'}},
          {_id: 'tl22', object: {_id: 'msg2'}},
          {_id: 'tl23', object: {_id: 'msg2'}},
          {_id: 'tl24', object: {_id: 'msg2'}},
          {_id: 'tl25', object: {_id: 'msg3'}},
          {_id: 'tl26', object: {_id: 'msg2'}},
          {_id: 'tl27', object: {_id: 'msg2'}},
          {_id: 'tl28', object: {_id: 'msg2'}},
          {_id: 'tl29', object: {_id: 'msg2'}},
          {_id: 'tl30', object: {_id: 'cmt3'}, inReplyTo: [{_id: 'msg1'}]}
        ];

        var entries2 = [
          {_id: 'tl31', object: {_id: 'msg14'}},
          {_id: 'tl32', object: {_id: 'msg2'}},
          {_id: 'tl33', object: {_id: 'msg2'}},
          {_id: 'tl34', object: {_id: 'msg18'}}
        ];

        var entries = [entries1, entries2];

        this.restcursor = function(api) {
          return {
            nextItems: function(callback) {
              if (entries.length === 1) {
                this.endOfStream = true;
              }
              return callback(null, entries.shift());
            },
            endOfStream: false
          };
        };

        var scope = {mostRecentActivityId: 'message1', threads: [] };

        angular.mock.module(function($provide) {
          $provide.value('activitystreamAPI', self.asAPI);
          $provide.value('restcursor', self.restcursor);
        });
        inject(function(activityStreamUpdates, $rootScope, $httpBackend, Restangular) {
          Restangular.setFullResponse(true);
          $httpBackend.expectGET('/messages?ids%5B%5D=msg1&ids%5B%5D=msg2&ids%5B%5D=msg3&ids%5B%5D=msg4&ids%5B%5D=msg18&ids%5B%5D=msg14')
          .respond([
            {_id: 'msg1', contgent: 'message msg1'},
            {_id: 'msg3', contgent: 'message msg3'},
            {_id: 'msg2', contgent: 'message msg2'},
            {_id: 'msg4', contgent: 'message msg4'},
            {_id: 'msg14', contgent: 'message msg14'},
            {_id: 'msg18', contgent: 'message msg18'}
          ]);
          $httpBackend.expectGET('/messages?ids%5B%5D=msg14&ids%5B%5D=msg2&ids%5B%5D=msg18')
          .respond([
            {_id: 'msg2', contgent: 'message msg2'},
            {_id: 'msg14', contgent: 'message msg14'},
            {_id: 'msg18', contgent: 'message msg18'}
          ]);

          activityStreamUpdates('0987654321', scope).then(
            function() {
              expect(scope.threads).to.have.length(6);
              expect(scope.threads[0]._id).to.equal('msg18');
              expect(scope.threads[1]._id).to.equal('msg2');
              expect(scope.threads[2]._id).to.equal('msg14');
              expect(scope.threads[3]._id).to.equal('msg1');
              expect(scope.threads[4]._id).to.equal('msg3');
              expect(scope.threads[5]._id).to.equal('msg4');
              done();
            },
            function(err) {done(new Error('I should not be called'));}
          ).catch (function(err) {
            throw err;
          });
          $httpBackend.flush();
        });
      });
    });

  });

  describe('activitystreamNotification directive', function() {
    var callbackOnWeakInfo;
    var callbackOnNotification;

    var sessionId = '12345';

    beforeEach(function() {
      module('jadeTemplates');

      var asMoment = function() {
        return {
          fromNow: function() {}
        };
      };

      var asSession = {
        user: {
          _id: sessionId
        }
      };

      var asNotificationFactory = {
        weakInfo: function(title, text) {
          callbackOnWeakInfo(title, text);
        }
      };

      var asSocket = function() {
        return {
          emit: function() {},
          on: function(event, callback) {
            callbackOnNotification = callback;
          },
          removeListener: function() {}
        };
      };

      angular.mock.module('esn.activitystream');
      angular.mock.module('esn.websocket');
      angular.mock.module('esn.notification');
      angular.mock.module(function($provide) {
        $provide.value('moment', asMoment);
        $provide.value('session', asSession);
        $provide.value('notificationFactory', asNotificationFactory);
        $provide.value('socket', asSocket);
      });
    });
    beforeEach(inject(['$compile', '$rootScope', function($c, $r) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
    }]));

    afterEach(function() {
      callbackOnWeakInfo = null;
      callbackOnNotification = null;
    });

    it('should call the method "notificationFactory.weakInfo(title, text)"', function(done) {
      callbackOnWeakInfo = function(title, text) {
        expect(title).to.exist;
        expect(text).to.exist;
        done();
      };

      var html = '<activity-stream-notification activitystream-uuid="0987654321"></activity-stream-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        actor: {
          _id: '123',
          displayName: ''
        },
        published: ''
      };
      callbackOnNotification({room: '0987654321', data: msg});
    });

    it('should not call the method "notificationFactory.weakInfo(title, text)" ' +
      'if the actor._id is equal to session.user._id', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not pass here'));
      };

      var html = '<activity-stream-notification activitystream-uuid="0987654321"></activity-stream-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        actor: {
          _id: sessionId,
          displayName: ''
        },
        published: ''
      };
      callbackOnNotification({room: '0987654321', data: msg});
      // Wait to see if the callback is called
      setTimeout(function() {
        done();
      }, 100);
    });

    it('should not call the method "notificationFactory.weakInfo(title, text)" ' +
      'if the room and activity stream uuid is different', function(done) {
      callbackOnWeakInfo = function() {
        done(new Error('Should not pass here'));
      };

      var html = '<activity-stream-notification activitystream-uuid="0987654321"></activity-stream-notification>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(callbackOnNotification).to.be.a('function');
      var msg = {
        actor: {
          _id: '123',
          displayName: ''
        },
        published: ''
      };
      callbackOnNotification({room: '098765', data: msg});
      // Wait to see if the callback is called
      setTimeout(function() {
        done();
      }, 100);
    });
  });

  describe('activitystream directive', function() {
    beforeEach(module('jadeTemplates'));
    beforeEach(function() {
      module('jadeTemplates');
      angular.mock.module('esn.activitystream');
    });
    beforeEach(inject(['$compile', '$rootScope', '$timeout', '$httpBackend', 'Restangular', function($c, $r, $t, $h, R) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.$timeout = $t;
      this.$httpBackend = $h;
      R.setFullResponse(true);
    }]));
    it('should get the activitystream UUID from the HTML attribute and put it into the scope', function() {
      var html = '<activity-stream activitystream-uuid="0987654321"></activity-stream>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      expect(this.$scope.activitystreamUuid).to.equal('0987654321');
    });
    it('should call scope.loadElement() method', function(done) {
      var html = '<activity-stream activitystream-uuid="0987654321"></activity-stream>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      this.$scope.loadMoreElements = done;
      this.$timeout.flush();
    });
    it('should call scope.getStreamUpdates() method when a "message:posted" event is emitted with this activitystream uuid', function(done) {
      var html = '<activity-stream activitystream-uuid="0987654321"></activity-stream>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      this.$scope.loadMoreElements = function() {};
      this.$scope.getStreamUpdates = done;
      this.$timeout.flush();
      this.$rootScope.$emit('message:posted', {activitystreamUuid: '0987654321'});
    });
    it('should update scope.lastPost.messageId when a "message:posted" event is emitted with this activitystream uuid', function() {
      var html = '<activity-stream activitystream-uuid="0987654321"></activity-stream>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      this.$scope.loadMoreElements = function() {};
      this.$scope.getStreamUpdates = function() {};
      this.$timeout.flush();
      this.$rootScope.$emit('message:posted', {activitystreamUuid: '0987654321', id: 'msg42'});
      expect(this.$scope.lastPost.messageId).to.equal('msg42');
    });
    it('should update the thread comments method when a "message:comment" event is emitted', function() {
      var html = '<activity-stream activitystream-uuid="0987654321"></activity-stream>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      this.$scope.loadMoreElements = function() {};
      this.$timeout.flush();

      this.$httpBackend.expectGET('/messages/msg2').respond({
        _id: 'msg2',
        responses: [
          {_id: 'cmt2'},
          {_id: 'cmt4'}
        ]
      });

      this.$scope.threads.push(
        {_id: 'msg1', responses: [{_id: 'cmt1'}] },
        {_id: 'msg2', responses: [{_id: 'cmt2'}] },
        {_id: 'msg3', responses: [{_id: 'cmt3'}] }
      );
      this.$rootScope.$emit('message:comment', {parent: {_id: 'msg2'}});
      this.$httpBackend.flush();
      expect(this.$scope.threads[1].responses).to.have.length(2);
    });

    it('should update scope.lastPost.comment when a "message:comment" event is emitted', function() {
      var html = '<activity-stream activitystream-uuid="0987654321"></activity-stream>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      this.$scope.loadMoreElements = function() {};
      this.$timeout.flush();

      this.$httpBackend.expectGET('/messages/msg2').respond({
        _id: 'msg2',
        responses: [
          {_id: 'cmt2'},
          {_id: 'cmt4'}
        ]
      });

      this.$scope.threads.push(
        {_id: 'msg1', responses: [{_id: 'cmt1'}] },
        {_id: 'msg2', responses: [{_id: 'cmt2'}] },
        {_id: 'msg3', responses: [{_id: 'cmt3'}] }
      );
      this.$rootScope.$emit('message:comment', {parent: {_id: 'msg2'}, id: 'cmt1'});
      this.$httpBackend.flush();
      expect(this.$scope.lastPost.comment).to.deep.equal({id: 'cmt1', parentId: 'msg2'});
    });

    it('should ignore "message:comment" events when the comment parent is not in the threads', function() {
      var html = '<activity-stream activitystream-uuid="0987654321"></activity-stream>';
      this.$compile(html)(this.$scope);
      this.$rootScope.$digest();
      this.$scope.loadMoreElements = function() {};
      this.$timeout.flush();

      this.$scope.threads.push(
        {_id: 'msg1', responses: [{_id: 'cmt1'}] },
        {_id: 'msg2', responses: [{_id: 'cmt2'}] },
        {_id: 'msg3', responses: [{_id: 'cmt3'}] }
      );
      this.$rootScope.$emit('message:comment', {parent: {_id: 'msg33'}});
    });
  });
});
