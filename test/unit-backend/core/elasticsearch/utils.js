'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The ES utils module', function() {

  describe('The indexData function', function() {

    it('should call options.denormalize when defined', function(done) {
      mockery.registerMock('./elasticsearch', {
        addDocumentToIndex: function() {}
      });
      var data = {_id: 1};
      var options = {
        denormalize: function(document) {
          expect(document).to.deep.equal(data);
          done();
          return document;
        },
        data: data
      };
      this.helpers.rewireBackend('core/elasticsearch/utils').indexData(options);
    });

    it('should call elasticsearch.addDocumentToIndex', function(done) {
      var data = {_id: 1};
      var denormalized = {id: '1', foo: 'bar'};
      var options = {
        denormalize: function(document) {
          expect(document).to.deep.equal(data);
          return denormalized;
        },
        getId: function(document) {
          return document._id;
        },
        data: data,
        type: 'Mytype',
        index: 'type.idx'
      };

      mockery.registerMock('./elasticsearch', {
        addDocumentToIndex: function(doc, opts) {
          expect(doc).to.deep.equal(denormalized);
          expect(opts).to.deep.equal({
            index: options.index,
            type: options.type,
            id: denormalized.id
          });
          done();
        }
      });

      this.helpers.rewireBackend('core/elasticsearch/utils').indexData(options);
    });
  });

  describe('The removeFromIndex function', function() {

    it('should call elasticsearch.removeDocumentFromIndex', function(done) {
      var data = {id: '1'};
      var options = {
        data: data,
        type: 'Mytype',
        index: 'type.idx'
      };

      mockery.registerMock('./elasticsearch', {
        removeDocumentFromIndex: function(opts) {
          expect(opts).to.deep.equal({
            index: options.index,
            type: options.type,
            id: data.id
          });
          done();
        }
      });

      this.helpers.rewireBackend('core/elasticsearch/utils').removeFromIndex(options);
    });
  });
});
