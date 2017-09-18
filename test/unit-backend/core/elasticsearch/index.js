'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const q = require('q');

describe('The elasticsearch module', function() {
  let helpers;

  beforeEach(function() {
    helpers = this.helpers;

    mockery.registerMock('./listeners', {});
  });

  const getModule = () => helpers.rewireBackend('core/elasticsearch');

  describe('with config error', function() {

    beforeEach(function() {
      const EsnConfig = function() {
        return {
          get: function() {
            return q.reject(new Error('Error'));
          }
        };
      };

      mockery.registerMock('../esn-config', { EsnConfig });
    });

    it('should call the callback with the error "not found"', function(done) {
      var elasticsearch = require('../../../../backend/core/elasticsearch');
      elasticsearch.updateClient(function(err, elasticsearchClient) {
        expect(err).to.exist;
        expect(elasticsearchClient).not.to.exist;
        expect(err.message).to.equal('Error');
        done();
      });
    });
  });

  describe('with no config', function() {

    beforeEach(function() {
      const EsnConfig = function() {
        return {
          get: function() {
            return q.when();
          }
        };
      };

      mockery.registerMock('../esn-config', { EsnConfig });
    });

    afterEach(function() {
      delete process.env.ES_HOST;
      delete process.env.ES_PORT;
    });

    it('should initialize the client with a default configuration', function(done) {
      mockery.registerMock('elasticsearch', {
        Client: function(data) {
          expect(data).to.deep.equal({ host: 'localhost:9200' });

          this.ping = (options, callback) => callback();
        }
      });

      this.helpers.requireBackend('core/elasticsearch').updateClient(() => done());
    });

    it('should support environment variables', function(done) {
      process.env.ES_HOST = 'es';
      process.env.ES_PORT = 1234;

      mockery.registerMock('elasticsearch', {
        Client: function(data) {
          expect(data).to.deep.equal({ host: 'es:1234' });

          this.ping = (options, callback) => callback();
        }
      });

      this.helpers.requireBackend('core/elasticsearch').updateClient(() => done());
    });

  });

  describe('with correct config and can not connect', function() {

    beforeEach(function() {
      const EsnConfig = function() {
        return {
          get: function() {
            return q.when({
              host: 'localhost:9200'
            });
          }
        };
      };

      mockery.registerMock('../esn-config', { EsnConfig });

      var mockedElasticsearch = {
        Client: function Client() {
          this.ping = function(object, callback) {
            return callback(new Error('Error'));
          };
        }
      };
      mockery.registerMock('elasticsearch', mockedElasticsearch);
    });

    it('should call the callback with the error "cannot connect"', function(done) {
      var elasticsearch = require('../../../../backend/core/elasticsearch');
      elasticsearch.updateClient(function(err, elasticsearchClient) {
        expect(err).to.exist;
        expect(elasticsearchClient).not.to.exist;
        expect(err.message).to.equal('cannot connect');
        done();
      });
    });
  });

  describe('with correct config and can connect', function() {

    beforeEach(function() {
      const EsnConfig = function() {
        return {
          get: function() {
            return q.when({
              host: 'localhost:9200'
            });
          }
        };
      };

      mockery.registerMock('../esn-config', { EsnConfig });

      var mockedElasticsearch = {
        Client: function Client() {
          this.ping = function(object, callback) {
            return callback(null);
          };
        }
      };
      mockery.registerMock('elasticsearch', mockedElasticsearch);
    });

    it('should call the callback with an elasticsearch client', function(done) {
      var elasticsearch = require('../../../../backend/core/elasticsearch');
      elasticsearch.updateClient(function(err, elasticsearchClient) {
        expect(err).not.to.exist;
        expect(elasticsearchClient).to.exist;
        done();
      });
    });
  });

  describe('The getClient function', function() {
    it('should reject when client sends back error', function(done) {
      var error = 'You failed';
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback(new Error(error));
      });
      module.getClient().then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.errorWithMessage(done, error));
    });

    it('should reject when client can not be found', function(done) {
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback();
      });
      module.getClient().then(this.helpers.callbacks.notCalled(done), this.helpers.callbacks.errorWithMessage(done, 'Can not get ES client'));
    });

    it('should resolve with the client whn it exists', function(done) {
      var client = {id: 1};
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback(null, client);
      });
      module.getClient().then(function(result) {
        expect(result).to.deep.equal(client);
        done();
      }, this.helpers.callbacks.notCalled(done));
    });
  });

  describe('The addDocumentToIndex function', function() {

    it('should send back error when getClient sends back error', function(done) {
      var error = new Error('You failed');
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback(error);
      });
      module.addDocumentToIndex({}, {}, function(err) {
        expect(err).to.equal(error);
        done();
      });
    });

    it('should send back error when getClient does not return client', function(done) {
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback();
      });
      module.addDocumentToIndex({}, {}, function(err) {
        expect(err.message).to.match(/Can not get ES client/);
        done();
      });
    });

    it('should index document with given options', function(done) {

      var opts = {
        index: 'users.idx',
        type: 'user',
        id: '123'
      };

      var document = {
        id: '123',
        yo: 'lo'
      };

      var client = {
        index: function(options, callback) {
          expect(options.index).to.equal(opts.index);
          expect(options.type).to.equal(opts.type);
          expect(options.id).to.equal(opts.id);
          callback();
        }
      };
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback(null, client);
      });
      module.addDocumentToIndex(document, opts, done);
    });
  });

  describe('The removeDocumentFromIndex function', function() {

    it('should send back error when getClient sends back error', function(done) {
      var error = new Error('You failed');
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback(error);
      });
      module.removeDocumentFromIndex({}, function(err) {
        expect(err).to.equal(error);
        done();
      });
    });

    it('should send back error when getClient does not return client', function(done) {
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback();
      });
      module.removeDocumentFromIndex({}, function(err) {
        expect(err.message).to.match(/Can not get ES client/);
        done();
      });
    });

    it('should remove the document with given options', function(done) {

      var opts = {
        id: '123',
        index: 'users.idx',
        type: 'user'
      };

      var client = {
        delete: function(options, callback) {
          expect(options.index).to.equal(opts.index);
          expect(options.type).to.equal(opts.type);
          expect(options.id).to.equal(opts.id);
          callback();
        }
      };
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback(null, client);
      });
      module.removeDocumentFromIndex(opts, done);
    });
  });

  describe('the searchDocuments function', function() {
    it('should call search on ES client', function(done) {

      var opts = {
        id: '123',
        index: 'users.idx',
        query: 'foobar'
      };

      var client = {
        search: function(options, callback) {
          expect(options).to.deep.equal(opts);
          callback();
        }
      };
      var module = this.helpers.rewireBackend('core/elasticsearch');
      module.__set__('client', function(callback) {
        return callback(null, client);
      });
      module.searchDocuments(opts, done);
    });
  });

  describe('The reconfig function', function() {
    let ESConfigurationMock, reconfigMock;
    const indexName = 'name';
    const indexType = 'type';

    beforeEach(function() {
      const EsnConfig = function() {
        return {
          get: function() {
            return q.when();
          }
        };
      };

      mockery.registerMock('../esn-config', { EsnConfig });

      ESConfigurationMock = function() {
        return {
          reconfig: reconfigMock
        };
      };

      mockery.registerMock('esn-elasticsearch-configuration', ESConfigurationMock);
    });

    it('should reject if failed to reindex configutaion', function(done) {
      reconfigMock = sinon.stub().returns(q.reject());

      getModule().reconfig(indexName, indexType)
        .catch(() => {
          expect(reconfigMock).to.have.been.calledWith(indexName, indexType);
          done();
        });
    });

    it('should resolve if reindex configutaion successfully', function(done) {
      reconfigMock = sinon.stub().returns(q.when());

      getModule().reconfig(indexName, indexType)
        .then(() => {
          expect(reconfigMock).to.have.been.calledWith(indexName, indexType);
          done();
        });
    });
  });

  describe('The reindex function', function() {
    let ESConfigurationMock, reindexAllMock;
    const options = { foo: 'bar' };

    beforeEach(function() {
      const EsnConfig = function() {
        return {
          get: function() {
            return q.when();
          }
        };
      };

      mockery.registerMock('../esn-config', { EsnConfig });

      ESConfigurationMock = function() {
        return {
          reindexAll: reindexAllMock
        };
      };

      mockery.registerMock('esn-elasticsearch-configuration', ESConfigurationMock);
    });

    it('should reject if failed to reindex configuration and data', function(done) {
      reindexAllMock = sinon.stub().returns(q.reject());

      getModule().reindex(options)
        .catch(() => {
          expect(reindexAllMock).to.have.been.calledWith(options);
          done();
        });
    });

    it('should resolve if reindex configuration and data successfully', function(done) {
      reindexAllMock = sinon.stub().returns(q.when());

      getModule().reindex(options)
        .then(() => {
          expect(reindexAllMock).to.have.been.calledWith(options);
          done();
        });
    });
  });
});
