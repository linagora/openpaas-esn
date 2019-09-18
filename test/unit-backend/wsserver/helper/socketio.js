const { expect } = require('chai');

describe('The socketio helper module', function() {
  describe('getUserSocketsFromNamespace() method', function() {
    beforeEach(function() {
      this.store = this.helpers.requireBackend('wsserver/socketstore');

      const sock1 = {request: {userId: 'user1'}, id: 'socket1user1'};
      const sock2 = {request: {userId: 'user1'}, id: 'socket2user1'};
      const sock3 = {request: {userId: 'user2'}, id: 'socket3user2'};

      this.store.registerSocket(sock1);
      this.store.registerSocket(sock2);
      this.store.registerSocket(sock3);
    });
    it('should return the socket of userId, present in the nsSockets object', function() {
      const nsSockets = [
        {id: 'namespace#socket1user1', namespace: true, conn: { id: 'socket1user1' }},
        {id: 'namespace#socket1user1', namespace: true, conn: { id: 'socket3user2' }}
      ];
      const helper = this.helpers.requireBackend('wsserver/helper/socketio');
      const userSockets = helper.getUserSocketsFromNamespace('user1', nsSockets);

      expect(userSockets).to.be.an.array;
      expect(userSockets).to.have.length(1);
      expect(userSockets[0].id).to.equal('namespace#socket1user1');
      expect(userSockets[0].namespace).to.be.true;
    });

    it('should return the sockets of userId, present in the nsSockets object', function() {
      const nsSockets = [
        {id: 'namespace#socket1user1', namespace: true, conn: { id: 'socket1user1' }},
        {id: 'namespace#socket2user1', namespace: true, conn: { id: 'socket2user1' }},
        {id: 'namespace#socket3user2', namespace: true, conn: { id: 'socket3user2' }}
      ];
      const helper = this.helpers.requireBackend('wsserver/helper/socketio');
      const userSockets = helper.getUserSocketsFromNamespace('user1', nsSockets);

      expect(userSockets).to.be.an.array;
      expect(userSockets).to.have.length(2);
      expect(userSockets[0].id).to.equal('namespace#socket1user1');
      expect(userSockets[0].namespace).to.be.true;
      expect(userSockets[1].id).to.equal('namespace#socket2user1');
      expect(userSockets[1].namespace).to.be.true;
    });
  });
});
