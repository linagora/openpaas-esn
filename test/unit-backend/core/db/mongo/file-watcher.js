'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('the file-watcher module', function() {

  beforeEach(function() {
    this.modulePath = this.testEnv.basePath + '/backend/core/db/mongo/file-watcher';
    this.logger = this.helpers.requireFixture('logger-noop')();
  });

  it('should be a function', function() {
    var fw = require(this.modulePath);
    expect(fw).to.be.a.function;
  });

  it('should be a function that returns a function', function() {
    var fw = require(this.modulePath);
    expect(fw()).to.be.a.function;
  });

  it('should call fs.stat when started', function(done) {
    var fsMock = {stat: done};
    mockery.registerMock('fs', fsMock);
    var fw = require(this.modulePath);
    fw()();
  });

  it('should call fs.stat with file argument when started', function(done) {
    var fsMock = {stat: function(file) {
      expect(file).to.equal('/tmp/test.js');
      done();
    }};
    mockery.registerMock('fs', fsMock);
    var fw = require(this.modulePath);
    fw(this.logger, '/tmp/test.js')();
  });

  it('should call chokidar.watch if the fs.stat succedded', function(done) {
    var fsMock = {stat: function(file, cb) {return cb(null, true);}};
    var chokidarMock = {
      watch: function() {
        done();
        return {
          on: function() {}
        };
      }
    };
    mockery.registerMock('fs', fsMock);
    mockery.registerMock('chokidar', chokidarMock);
    var fw = require(this.modulePath);
    fw(this.logger)();
  });

  it('should call chokidar.watch wityh the file as argument if the fs.stat succedded', function(done) {
    var fsMock = {stat: function(file, cb) {return cb(null, true);}};
    var chokidarMock = {
      watch: function(file) {
        expect(file).to.equal('/tmp/test2.js');
        done();
        return {
          on: function() {}
        };
      }
    };
    mockery.registerMock('fs', fsMock);
    mockery.registerMock('chokidar', chokidarMock);
    var fw = require(this.modulePath);
    fw(this.logger, '/tmp/test2.js')();
  });

  it('should bind on add and change events of chokidar', function() {
    var fsMock = {stat: function(file, cb) {return cb(null, true);}};
    var eventNames = [];
    var chokidarMock = {
      watch: function(file) {
        return {
          on: function(evtName) {eventNames.push(evtName);}
        };
      }
    };
    mockery.registerMock('fs', fsMock);
    mockery.registerMock('chokidar', chokidarMock);
    var fw = require(this.modulePath);
    fw(this.logger, '/tmp/test3.js')();
    expect(eventNames).to.deep.equal(['add', 'change']);
  });

  it('should not bind on add and change events of chokidar more than once', function() {
    var fsMock = {stat: function(file, cb) {return cb(null, true);}};
    var eventNames = [];
    var chokidarMock = {
      watch: function(file) {
        return {
          on: function(evtName) {eventNames.push(evtName);}
        };
      }
    };
    mockery.registerMock('fs', fsMock);
    mockery.registerMock('chokidar', chokidarMock);
    var fw = require(this.modulePath);
    var fwInstance = fw(this.logger, '/tmp/test3.js');
    fwInstance();
    fwInstance();
    expect(eventNames).to.deep.equal(['add', 'change']);
  });

  it('should bind the same event handler on add and change events of chokidar', function() {
    var fsMock = {stat: function(file, cb) {return cb(null, true);}};
    var eventCallbacks = [];
    var chokidarMock = {
      watch: function(file) {
        return {
          on: function(evtName, cb) {eventCallbacks.push(cb);}
        };
      }
    };
    mockery.registerMock('fs', fsMock);
    mockery.registerMock('chokidar', chokidarMock);
    var fw = require(this.modulePath);
    fw(this.logger, '/tmp/test3.js')();
    expect(eventCallbacks).to.have.length(2);
    expect(eventCallbacks[0]).to.equal(eventCallbacks[1]);
  });

  describe('event handler', function() {

    beforeEach(function() {
      var self = this;
      this.fsMock = {stat: function(file, cb) {return cb(null, true);}};
      this.chokidarMock = {
        watch: function(file) {
          return {
            on: function(evtName, cb) {self.eventCallback = cb;}
          };
        }
      };
    });

    it('should call hash_file', function(done) {
      var hashFileMock = function(file, algo, callback) {
        done();
      };
      mockery.registerMock('fs', this.fsMock);
      mockery.registerMock('chokidar', this.chokidarMock);
      mockery.registerMock('hash_file', hashFileMock);

      var fw = require(this.modulePath);
      fw(this.logger, '/tmp/test4.js')();
      this.eventCallback();
    });

    it('should call the change handler on first changed event', function(done) {
      var hashFileMock = function(file, algo, callback) {
        return callback(null, 'hash !');
      };
      mockery.registerMock('fs', this.fsMock);
      mockery.registerMock('chokidar', this.chokidarMock);
      mockery.registerMock('hash_file', hashFileMock);

      var fw = require(this.modulePath);
      fw(this.logger, '/tmp/test4.js', done)();
      this.eventCallback();
    });

    it('should not call the change handler if file hash changed', function() {
      var called = 0;
      var hashFileMock = function(file, algo, callback) {
        return callback(null, 'hash !');
      };
      mockery.registerMock('fs', this.fsMock);
      mockery.registerMock('chokidar', this.chokidarMock);
      mockery.registerMock('hash_file', hashFileMock);

      var fw = require(this.modulePath);
      fw(this.logger, '/tmp/test4.js', function() { called++;})();
      this.eventCallback();
      this.eventCallback();
      expect(called).to.equal(1);
    });

    it('should not call the change handler if file hash changed', function() {
      var called = 0;
      var hashFileMock = function(file, algo, callback) {
        return callback(null, 'hash !' + called);
      };
      mockery.registerMock('fs', this.fsMock);
      mockery.registerMock('chokidar', this.chokidarMock);
      mockery.registerMock('hash_file', hashFileMock);

      var fw = require(this.modulePath);
      fw(this.logger, '/tmp/test4.js', function() { called++;})();
      this.eventCallback();
      this.eventCallback();
      expect(called).to.equal(2);
    });

  });

});
