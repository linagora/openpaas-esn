'use strict';

var expect = require('chai').expect;

describe('The webrtc server module token auth middleware', function() {
  it('should return next() without argument if socket got a userId property', function(done) {
    var authmw = require(this.testEnv.basePath + '/backend/webrtc/auth/token');
    authmw({userId: 'user1'}, null, null, null, null, null, function(arg) {
      expect(arg).to.be.null;
      done();
    });
  });

  it('should return next(err) if socket do not have a userId property', function(done) {
    var authmw = require(this.testEnv.basePath + '/backend/webrtc/auth/token');
    authmw({}, null, null, null, null, null, function(arg) {
      expect(arg).to.be.an('object');
      done();
    });
  });
});
