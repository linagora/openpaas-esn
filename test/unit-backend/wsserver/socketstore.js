'use strict';
var expect = require('chai').expect;

describe('the websocket store module', function() {
  describe('registerSocket() method', function() {
    beforeEach(function() {
      this.store = require(this.testEnv.basePath + '/backend/wsserver/socketstore');
    });
    it('should throw an error if the userId is not set (null)', function(done) {
      try {
        this.store.registerSocket({}, null);
      } catch (e) {
        done();
      }
    });
    it('should throw an error if the userId is not set (true)', function(done) {
      try {
        this.store.registerSocket({}, true);
      } catch (e) {
        done();
      }
    });
    it('should throw an error if the userId is not set (empty string)', function(done) {
      try {
        this.store.registerSocket({}, '');
      } catch (e) {
        done();
      }
    });
    it('should set socket.userId on the socket object', function() {
      var socket = {id: 'socket1'};
      this.store.registerSocket(socket, 'user1');
      expect(socket.userId).to.equal('user1');
    });
  });

  describe('getSocketsForUser() method', function() {
    beforeEach(function() {
      this.store = require(this.testEnv.basePath + '/backend/wsserver/socketstore');
      var sock1 = {id: 'socket1user1'};
      var sock2 = {id: 'socket2user1'};
      var sock3 = {id: 'socket3user2'};
      this.store.registerSocket(sock1, 'user1');
      this.store.registerSocket(sock2, 'user1');
      this.store.registerSocket(sock3, 'user2');
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
      this.store = require(this.testEnv.basePath + '/backend/wsserver/socketstore');
      var sock1 = {id: 'socket1user1'};
      var sock2 = {id: 'socket2user1'};
      var sock3 = {id: 'socket3user2'};
      this.store.registerSocket(sock1, 'user1');
      this.store.registerSocket(sock2, 'user1');
      this.store.registerSocket(sock3, 'user2');
    });
    it('should not fail if the user do not have registered sockets', function() {
      this.store.unregisterSocket({id: 'socket4', userId: 'user3'});
    });
    it('should not fail if the socket is unknown', function() {
      this.store.unregisterSocket({id: 'socket4', userId: 'user1'});
    });
    it('should unregister socket', function() {
      var sockets = this.store.getSocketsForUser('user1');
      expect(sockets).to.be.an.array;
      expect(sockets).to.have.length(2);
      this.store.unregisterSocket({id: 'socket1user1', userId: 'user1'});
      sockets = this.store.getSocketsForUser('user1');
      expect(sockets).to.be.an.array;
      expect(sockets).to.have.length(1);
    });
  });

});
