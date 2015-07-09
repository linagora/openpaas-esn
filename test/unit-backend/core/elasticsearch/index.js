'use strict';

var expect = require('chai').expect,
  mockery = require('mockery');

describe('The elasticsearch module', function() {

  describe('with config error', function() {

    beforeEach(function() {
      var get = function(callback) {
        callback(new Error('Error'), null);
      };
      this.helpers.mock.esnConfig(get);
    });

    it('should call the callback with the error "not found"', function(done) {
      var elasticsearch = require('../../../../backend/core/elasticsearch');
      elasticsearch.updateClient(function(err, elasticsearchClient) {
        expect(err).to.exist;
        expect(elasticsearchClient).not.to.exist;
        expect(err.message).to.equal('not found');
        done();
      });
    });
  });

  describe('with correct config and can not connect', function() {

    beforeEach(function() {
      var get = function(callback) {
        callback(null, {
          host: 'localhost:9200'
        });
      };
      this.helpers.mock.esnConfig(get);

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
      var get = function(callback) {
        callback(null, {
          host: 'localhost:9200'
        });
      };
      this.helpers.mock.esnConfig(get);

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
        'delete': function(options, callback) {
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
});
