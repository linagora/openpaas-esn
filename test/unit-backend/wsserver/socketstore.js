'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

describe('the websocket store module', function() {
  describe('registerSocket() method', function() {
    beforeEach(function() {
      this.store = this.helpers.requireBackend('wsserver/socketstore');
    });
    it('should throw an error if the userId is not set (null)', function(done) {
      try {
        this.store.registerSocket({});
      } catch (e) {
        done();
      }
    });
    it('should throw an error if the userId is not set (true)', function(done) {
      try {
        this.store.registerSocket({request: {userId: true}});
      } catch (e) {
        done();
      }
    });
    it('should throw an error if the userId is not set (empty string)', function(done) {
      try {
        this.store.registerSocket({request: {userId: ''}});
      } catch (e) {
        done();
      }
    });
  });

  describe('getSocketsForUser() method', function() {
    beforeEach(function() {
      this.store = this.helpers.requireBackend('wsserver/socketstore');
      var sock1 = {id: 'socket1user1', request: {userId: 'user1'}};
      var sock2 = {id: 'socket2user1', request: {userId: 'user1'}};
      var sock3 = {id: 'socket3user2', request: {userId: 'user2'}};
      this.store.registerSocket(sock1);
      this.store.registerSocket(sock2);
      this.store.registerSocket(sock3);
    });
    it('should return an empty array if there is no socket for the user', function() {
      var sockets = this.store.getSocketsForUser('user3');
      expect(sockets).to.be.an.array;
      expect(sockets).to.have.length(0);
    });
    it('should return an array of sockets of the user', function() {
      var sockets = this.store.getSocketsForUser('user1');
      expect(sockets).to.be.an.array;
      expect(sockets).to.have.length(2);
    });
  });
  describe('unregisterSocket() method', function() {
    beforeEach(function() {
      this.store = this.helpers.requireBackend('wsserver/socketstore');
      var sock1 = {id: 'socket1user1', request: {userId: 'user1'}};
      var sock2 = {id: 'socket2user1', request: {userId: 'user1'}};
      var sock3 = {id: 'socket3user2', request: {userId: 'user2'}};
      this.store.registerSocket(sock1);
      this.store.registerSocket(sock2);
      this.store.registerSocket(sock3);
    });
    it('should not fail if the user do not have registered sockets', function() {
      this.store.unregisterSocket({id: 'socket4', request: {userId: 'user3'}});
    });
    it('should not fail if the socket is unknown', function() {
      this.store.unregisterSocket({id: 'socket4', request: {userId: 'user1'}});
    });
    it('should unregister socket', function() {
      var sockets = this.store.getSocketsForUser('user1');
      expect(sockets).to.be.an.array;
      expect(sockets).to.have.length(2);
      this.store.unregisterSocket({id: 'socket1user1', request: {userId: 'user1'}});
      sockets = this.store.getSocketsForUser('user1');
      expect(sockets).to.be.an.array;
      expect(sockets).to.have.length(1);
    });
  });

  describe('the clean function', function() {
    beforeEach(function() {
      this.store = this.helpers.requireBackend('wsserver/socketstore');
    });

    it('should disconnect and unregister all the stored websockets', function() {
      const socket1 = {_id: 1, disconnect: sinon.spy(), request: {userId: 'user1'}};
      const socket2 = {_id: 2, disconnect: sinon.spy(), request: {userId: 'user2'}};
      const socket3 = {_id: 3, disconnect: sinon.spy(), request: {userId: 'user3'}};

      this.store.registerSocket(socket1);
      this.store.registerSocket(socket2);
      this.store.registerSocket(socket3);

      this.store.clean();

      expect(socket1.disconnect).to.have.been.calledWith(true);
      expect(socket2.disconnect).to.have.been.calledWith(true);
      expect(socket3.disconnect).to.have.been.calledWith(true);
    });
  });
});
