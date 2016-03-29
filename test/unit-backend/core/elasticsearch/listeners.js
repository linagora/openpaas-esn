'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The ES listeners module', function() {

  describe('The addListener function', function() {

    it('should return an object', function() {
      var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
      var handler = module.addListener({events: {}});
      expect(handler.indexData).to.be.a.function;
      expect(handler.removeFromIndex).to.be.a.function;
    });

    it('should return a function to index a document', function(done) {
      var data = {foo: 'bar'};
      var opts = {events: {}, denormalize: 1, getId: 2, index: 3, type: 4};
      mockery.registerMock('./utils', {
        indexData: function(options, callback) {
          expect(options).to.deep.equal({
            denormalize: opts.denormalize,
            getId: opts.getId,
            index: opts.index,
            type: opts.type,
            data: data
          });
          callback();
        }
      });
      var handler = this.helpers.rewireBackend('core/elasticsearch/listeners').addListener(opts);
      handler.indexData(data, done);
    });

    it('should return a function to remove a document from index', function(done) {
      var data = {foo: 'bar'};
      var opts = {events: {}, denormalize: 1, getId: 2, index: 3, type: 4};
      mockery.registerMock('./utils', {
        removeFromIndex: function(options, callback) {
          expect(options).to.deep.equal({
            data: data,
            getId: opts.getId,
            index: opts.index,
            type: opts.type
          });
          callback();
        }
      });
      var handler = this.helpers.rewireBackend('core/elasticsearch/listeners').addListener(opts);
      handler.removeFromIndex(data, done);
    });

    describe('The options.events', function() {

      var pubsubMock;

      beforeEach(function() {
        pubsubMock = {};
        mockery.registerMock('./utils', {});
        mockery.registerMock('../pubsub', {
          local: pubsubMock
        });
      });

      it('should register a listener when options.events.add is defined', function(done) {
        var eventName = 'foobarbaz';
        var options = {
          events: {
            add: eventName
          }
        };
        pubsubMock.topic = function(name) {
          expect(name).to.equal(eventName);
          return {
            subscribe: function() {
              done();
            }
          };
        };
        var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
        module.addListener(options);
      });

      it('should register a listener when options.events.update is defined', function(done) {
        var eventName = 'foobarbaz';
        var options = {
          events: {
            update: eventName
          }
        };
        pubsubMock.topic = function(name) {
          expect(name).to.equal(eventName);
          return {
            subscribe: function() {
              done();
            }
          };
        };
        var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
        module.addListener(options);
      });

      it('should register a listener when options.events.remove is defined', function(done) {
        var eventName = 'foobarbaz';
        var options = {
          events: {
            remove: eventName
          }
        };
        pubsubMock.topic = function(name) {
          expect(name).to.equal(eventName);
          return {
            subscribe: function() {
              done();
            }
          };
        };
        var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
        module.addListener(options);
      });
    });

    describe('The removeFromIndex function', function() {
      var pubsubMock, subscribeFn;

      beforeEach(function() {
        subscribeFn = null;
        pubsubMock = {
          topic: function() {
            return {
              subscribe: function(subscribe) {
                subscribeFn = subscribe;
              }
            };
          }
        };

        mockery.registerMock('../pubsub', {
          local: pubsubMock
        });
      });

      it('should be called with right parameters', function(done) {
        var options = {
          events: {
            remove: '123'
          },
          index: 'contacts.idx',
          type: 'contact',
          denormalize: true,
          getId: true
        };
        var data = {_id: '123'};

        mockery.registerMock('./utils', {
          removeFromIndex: function(input) {
            expect(input).to.deep.equal({
              index: options.index,
              type: options.type,
              getId: options.getId,
              data: data
            });
            done();
          }
        });
        var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
        module.addListener(options);
        subscribeFn(data);
      });
    });
  });

  describe('The index function', function() {

    var pubsubMock;
    beforeEach(function() {
      pubsubMock = {
        topic: function() {
          return {
            subscribe: function(subscribe) {
            }
          };
        }
      };

      mockery.registerMock('../pubsub', {
        global: pubsubMock
      });
    });

    it('should be called with right parameters', function(done) {
      var options = {
        events: {
          add: '123'
        },
        index: 'contacts.idx',
        type: 'contact',
        denormalize: true,
        getId: true
      };
      var data = {_id: '123'};

      mockery.registerMock('./utils', {
        indexData: function(input) {
          expect(input).to.deep.equal({
            denormalize: options.denormalize,
            getId: options.getId,
            index: options.index,
            type: options.type,
            data: data
          });
          done();
        }
      });
      var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
      module.index(data, options);
    });

    it('should use the denormalize function from options when defined', function(done) {
      var options = {
        events: {
          add: '123'
        },
        denormalize: function() {}
      };
      mockery.registerMock('./utils', {
        indexData: function(opts) {
          expect(opts.denormalize).to.deep.equal(options.denormalize);
          done();
        }
      });
      var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
      module.index({}, options);
    });

    it('should use the default denormalize function when options.denormalize is not defined', function(done) {
      var options = {
        events: {
          add: '123'
        }
      };
      mockery.registerMock('./utils', {
        indexData: function(opts) {
          expect(opts.denormalize).to.be.a.function;
          done();
        }
      });
      var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
      module.index({}, options);
    });

    it('should call the callback when defined', function(done) {
      var options = {};
      var result = {foo: 'bar'};
      mockery.registerMock('./utils', {
        indexData: function(opts, callback) {
          return callback(null, result);
        }
      });
      var module = this.helpers.rewireBackend('core/elasticsearch/listeners');
      module.index({}, options, function(_err, _result) {
        expect(_err).to.not.be.defined;
        expect(_result).to.deep.equal(result);
        done();
      });
    });
  });

});
