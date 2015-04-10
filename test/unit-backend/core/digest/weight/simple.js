'use strict';

describe('Simple digest weight processor', function() {

  describe('The computeMessageWeight fn', function(done) {
    it('should return a promise', function() {
      var module = this.helpers.requireBackend('core/digest/weight/simple');
      module.computeMessageWeight({}, {}).then(done);
    });
  });

});
