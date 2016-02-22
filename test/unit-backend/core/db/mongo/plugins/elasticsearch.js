'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The ES Mongoose plugin', function() {

  it('should index document in elasticsearch on schema.post("save")', function(done) {

    var options = {foo: 'bar'};
    mockery.registerMock('../../../elasticsearch/listeners', {
      index: function(self, indexOptions) {
        expect(indexOptions).to.deep.equal(options);
        done();
      }
    });
    var plugin = this.helpers.rewireBackend('core/db/mongo/plugins/elasticsearch')(options);
    var schema = {
      post: function(type, callback) {
        expect(type).to.equal('save');
        callback();
      }
    };
    plugin(schema);
  });
});
