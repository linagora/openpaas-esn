'use strict';

var expect = require('chai').expect;

describe('The startup-buffer middleware', function() {
  it('should block buffer until TTL, then call next ', function(done) {
    var called = false;
    function next() { called = true; }

    var mwConstructor = this.helpers.requireBackend('webserver/middleware/startup-buffer');
    var mw = mwConstructor(500);
    mw(null, null, next);
    expect(called).to.be.false;
    setTimeout(function() {
      expect(called).to.be.true;
      done();
    },600);
  });
  it('should unblock buffer if the event "webserver:mongosessionstoreEnabled" is received', function() {
    var core = this.helpers.requireBackend('core'),
        topic = core.pubsub.local.topic('webserver:mongosessionstoreEnabled');
    var called = false;
    function next() { called = true; }

    var mwConstructor = this.helpers.requireBackend('webserver/middleware/startup-buffer');
    var mw = mwConstructor(50000);
    mw(null, null, next);
    expect(called).to.be.false;
    topic.publish({});
    expect(called).to.be.true;
  });
});
