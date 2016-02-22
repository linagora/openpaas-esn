'use strict';

var mockery = require('mockery');

describe('The ES pubsub module', function() {

  describe('The init function', function() {

    it('should call user.register', function(done) {
      mockery.registerMock('../user/listener', {
        register: done
      });
      this.helpers.rewireBackend('core/elasticsearch/pubsub').init();
    });
  });
});
