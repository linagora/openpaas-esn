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
});
