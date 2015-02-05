'use strict';

var expect = require('chai').expect;

describe('The socketio helper module', function() {
  describe('getUserSocketsFromNamespace() method', function() {
    beforeEach(function() {
      this.store = this.helpers.requireBackend('wsserver/socketstore');
      var sock1 = {request: {userId: 'user1'}, id: 'socket1user1'};
      var sock2 = {request: {userId: 'user1'}, id: 'socket2user1'};
      var sock3 = {request: {userId: 'user2'}, id: 'socket3user2'};
      this.store.registerSocket(sock1);
      this.store.registerSocket(sock2);
      this.store.registerSocket(sock3);
    });
    it('should return the socket of userId, present in the nsSockets object', function() {
      var nsSockets = [
        {id: 'socket1user1', namespace: true},
        {id: 'socket3user2', namespace: true}
      ];
      var helper = this.helpers.requireBackend('wsserver/helper/socketio');
      var userSockets = helper.getUserSocketsFromNamespace('user1', nsSockets);
      expect(userSockets).to.be.an.array;
      expect(userSockets).to.have.length(1);
      expect(userSockets[0].id).to.equal('socket1user1');
      expect(userSockets[0].namespace).to.be.true;
    });
    it('should return the sockets of userId, present in the nsSockets object', function() {
      var nsSockets = [
        {id: 'socket1user1', namespace: true},
        {id: 'socket2user1', namespace: true},
        {id: 'socket3user2', namespace: true}
      ];
      var helper = this.helpers.requireBackend('wsserver/helper/socketio');
      var userSockets = helper.getUserSocketsFromNamespace('user1', nsSockets);
      expect(userSockets).to.be.an.array;
      expect(userSockets).to.have.length(2);
      expect(userSockets[0].id).to.equal('socket1user1');
      expect(userSockets[0].namespace).to.be.true;
      expect(userSockets[1].id).to.equal('socket2user1');
      expect(userSockets[1].namespace).to.be.true;
    });
  });
});
