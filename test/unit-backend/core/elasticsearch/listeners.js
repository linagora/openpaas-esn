'use strict';

const mockery = require('mockery');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const Q = require('q');

describe('The ES listeners module', function() {

  describe('The addListener function', function() {

    it('should return an object', function() {
      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');
      const handler = module.addListener({events: {}});

      expect(handler.indexData).to.be.a.function;
      expect(handler.removeFromIndex).to.be.a.function;
    });

    it('should return a function to index a document', function(done) {
      const data = {foo: 'bar'};
      const opts = {events: {}, denormalize: 1, getId: 2, index: 3, type: 4};
      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.indexData = function(options, callback) {
        expect(options).to.deep.equal({
          denormalize: opts.denormalize,
          getId: opts.getId,
          index: opts.index,
          type: opts.type,
          data: data
        });
        callback();
      };

      const handler = this.helpers.rewireBackend('core/elasticsearch/listeners').addListener(opts);

      handler.indexData(data, done);
    });

    it('should return a function to remove a document from index', function(done) {
      const data = {foo: 'bar'};
      const opts = {events: {}, denormalize: 1, getId: 2, index: 3, type: 4};
      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.removeFromIndex = function(options, callback) {
        expect(options).to.deep.equal({
          data: data,
          getId: opts.getId,
          index: opts.index,
          type: opts.type
        });
        callback();
      };

      const handler = this.helpers.rewireBackend('core/elasticsearch/listeners').addListener(opts);

      handler.removeFromIndex(data, done);
    });

    describe('The options.events', function() {

      var pubsubMock;

      beforeEach(function() {
        pubsubMock = {};
        mockery.registerMock('../pubsub', {
          local: pubsubMock,
          global: {
            topic: function() {
              return {
                subscribe: function() {}
              };
            }
          }
        });
      });

      it('should register a listener when options.events.add is defined', function(done) {
        const eventName = 'foobarbaz';
        const options = {
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

        const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

        module.addListener(options);
      });

      it('should register a listener when options.events.update is defined', function(done) {
        const eventName = 'foobarbaz';
        const options = {
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
        const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

        module.addListener(options);
      });

      it('should register a listener when options.events.remove is defined', function(done) {
        const eventName = 'foobarbaz';
        const options = {
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

        const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

        module.addListener(options);
      });
    });

    describe('The removeFromIndex function', function() {
      let pubsubMock, subscribeFn, options, data;

      beforeEach(function() {
        options = {
          events: {
            remove: '123'
          },
          index: 'contacts.idx',
          type: 'contact',
          denormalize: true,
          getId: true
        };
        data = {_id: '123'};
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
          local: pubsubMock,
          global: {
            topic: function() {
              return {
                subscribe: function() {}
              };
            }
          }
        });
      });

      it('should be called with right parameters', function(done) {
        const utils = this.helpers.requireBackend('core/elasticsearch/utils');

        utils.removeFromIndex = function(input) {
          expect(input).to.deep.equal({
            index: options.index,
            type: options.type,
            getId: options.getId,
            data: data
          });
          done();
        };

        const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

        module.addListener(options);
        subscribeFn(data);
      });
    });
  });

  describe('The remove function', function() {
    let pubsubMock, data;

    beforeEach(function() {
      data = {foo: 'bar'};
      pubsubMock = {
        topic: function() {
          return {
            subscribe: function() {}
          };
        }
      };

      mockery.registerMock('../pubsub', {
        global: pubsubMock
      });
    });

    it('should call the options.skip.remove function to check if index remove must be skipped', function(done) {
      const result = {foo: 'bar'};
      const options = {
        skip: {
          remove: sinon.spy(function() {
            return Q(false);
          })
        }
      };
      const utils = this.helpers.requireBackend('core/elasticsearch/utils');
      const removeFromIndexSpy = sinon.spy(function(optons, callback) {
        callback(null, result);
      });
      utils.removeFromIndex = removeFromIndexSpy;

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.remove(data, options, function(_err, _result) {
        expect(_err).to.not.be.defined;
        expect(_result).to.equals(result);
        expect(removeFromIndexSpy).to.have.been.called;
        expect(options.skip.remove).to.have.been.calledWith(data);
        done();
      });
    });

    it('should send back error when options.skip.remove function rejects', function(done) {
      const error = new Error('skip rejects');
      const options = {
        skip: {
          remove: sinon.spy(function() {
            return Q.reject(error);
          })
        }
      };
      const removeFromIndexSpy = sinon.spy();
      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.removeFromIndex = removeFromIndexSpy;

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.remove(data, options, function(err) {
        expect(err.message).to.equals(error.message);
        expect(removeFromIndexSpy).to.not.have.been.called;
        expect(options.skip.remove).to.have.been.calledWith(data);
        done();
      });
    });

    it('should not remove when options.skip.remove resolves to true', function(done) {
      const options = {
        skip: {
          remove: sinon.spy(function() {
            return Q(true);
          })
        }
      };

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.remove(data, options, function(_err, _result) {
        expect(_err).to.not.be.defined;
        expect(_result).to.not.be.defined;
        expect(options.skip.remove).to.have.been.calledWith(data);
        done();
      });
    });
  });

  describe('The index function', function() {
    let pubsubMock, data;

    beforeEach(function() {
      pubsubMock = {
        topic: function() {
          return {
            subscribe: function() {
            }
          };
        }
      };

      mockery.registerMock('../pubsub', {
        global: pubsubMock,
        local: {
          topic: function() {
            return {
              subscribe: function() {}
            };
          }
        }
      });
    });

    it('should be called with right parameters', function(done) {
      const options = {
        events: {
          add: '123'
        },
        index: 'contacts.idx',
        type: 'contact',
        denormalize: true,
        getId: true
      };
      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.indexData = function(input) {
        expect(input).to.deep.equal({
          denormalize: options.denormalize,
          getId: options.getId,
          index: options.index,
          type: options.type,
          data: data
        });
        done();
      };

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.index(data, options);
    });

    it('should use the denormalize function from options when defined', function(done) {
      const options = {
        events: {
          add: '123'
        },
        denormalize: function() {}
      };

      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.indexData = function(opts) {
        expect(opts.denormalize).to.deep.equal(options.denormalize);
        done();
      };

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.index({}, options);
    });

    it('should use the default denormalize function when options.denormalize is not defined', function(done) {
      const options = {
        events: {
          add: '123'
        }
      };

      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.indexData = function(opts) {
        expect(opts.denormalize).to.be.a.function;
        done();
      };

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.index({}, options);
    });

    it('should call the callback when defined', function(done) {
      const options = {};
      const result = {foo: 'bar'};

      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.indexData = function(opts, callback) {
        return callback(null, result);
      };

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.index({}, options, function(_err, _result) {
        expect(_err).to.not.be.defined;
        expect(_result).to.deep.equal(result);
        done();
      });
    });

    it('should call the options.skip.index function to check if index must be skipped', function(done) {
      const result = {foo: 'bar'};
      const options = {
        skip: {
          index: sinon.spy(function() {
            return Q(false);
          })
        }
      };
      const indexSpy = sinon.spy(function(optons, callback) {
        callback(null, result);
      });
      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.indexData = indexSpy;

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.index(data, options, function(_err, _result) {
        expect(_err).to.not.be.defined;
        expect(_result).to.equals(result);
        expect(indexSpy).to.have.been.called;
        expect(options.skip.index).to.have.been.calledWith(data);
        done();
      });
    });

    it('should send back error when options.skip.index rejects', function(done) {
      const error = new Error('skip rejects');
      const options = {
        skip: {
          index: sinon.spy(function() {
            return Q.reject(error);
          })
        }
      };
      const indexSpy = sinon.spy();

      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.indexData = indexSpy;

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.index(data, options, function(err) {
        expect(err.message).to.equals(error.message);
        expect(indexSpy).to.not.have.been.called;
        expect(options.skip.index).to.have.been.calledWith(data);
        done();
      });
    });

    it('should not index when options.skip.index resolves to true', function(done) {
      const options = {
        skip: {
          index: function() {
            return Q(true);
          }
        }
      };
      const indexSpy = sinon.spy();

      const utils = this.helpers.requireBackend('core/elasticsearch/utils');

      utils.indexData = indexSpy;

      const module = this.helpers.rewireBackend('core/elasticsearch/listeners');

      module.index(data, options, function(_err, _result) {
        expect(_err).to.not.be.defined;
        expect(_result).to.not.be.defined;
        expect(indexSpy).to.not.have.been.calledWith(data);
        done();
      });
    });
  });
});
