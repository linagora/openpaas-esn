'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const Q = require('q');

describe('The user status websocket lib', function() {
  let wsserver;

  beforeEach(function() {

    wsserver = {
      ioHelper: {},
      io: {
        sockets: {
          sockets: []
        }
      }
    };
    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.user.status/backend/lib/websocket';
    this.moduleHelpers.addDep('wsserver', wsserver);
  });

  describe('The updateLastActiveFromWebsocketConnections function', function() {
    it('should resolve without result when there are no sockets', function(done) {
      const updateLastActiveForUsers = sinon.spy();
      const module = require(this.moduleHelpers.backendPath)(this.moduleHelpers.dependencies, {userStatus: {updateLastActiveForUsers: updateLastActiveForUsers}});

      wsserver.ioHelper.getUserId = sinon.spy();

      module.updateLastActiveFromWebsocketConnections().then(result => {
        expect(result).to.not.be.defined;
        expect(updateLastActiveForUsers).to.not.have.been.called;
        expect(wsserver.ioHelper.getUserId).to.not.have.been.called;
        done();
      });
    });

    it('should resolve without result when socket are not flagged as connected', function(done) {
      const updateLastActiveForUsers = sinon.spy();
      const module = require(this.moduleHelpers.backendPath)(this.moduleHelpers.dependencies, {userStatus: {updateLastActiveForUsers: updateLastActiveForUsers}});

      wsserver.io.sockets.sockets = [{_id: 1, connected: false}, {_id: 2, connected: false}];
      wsserver.ioHelper.getUserId = sinon.spy();

      module.updateLastActiveFromWebsocketConnections().then(result => {
        expect(result).to.not.be.defined;
        expect(updateLastActiveForUsers).to.not.have.been.called;
        expect(wsserver.ioHelper.getUserId).to.not.have.been.called;
        done();
      });
    });

    it('should keep only unique users if multiple sockets are available', function(done) {
      const updateLastActiveForUsers = sinon.spy(function(users) {
        return Q(users);
      });
      const module = require(this.moduleHelpers.backendPath)(this.moduleHelpers.dependencies, {userStatus: {updateLastActiveForUsers: updateLastActiveForUsers}});

      wsserver.io.sockets.sockets = [
        {_id: 1, connected: false},
        {_id: 2, connected: true, userId: 123},
        {_id: 3, connected: false, userId: 123},
        {_id: 4, connected: false, userId: 123},
        {_id: 5, connected: true, userId: 234},
        {_id: 6, connected: true, userId: 234},
        {_id: 7, connected: false}
      ];
      wsserver.ioHelper.getUserId = sinon.spy(function(socket) {
        return socket.userId;
      });

      module.updateLastActiveFromWebsocketConnections().then(() => {
        expect(updateLastActiveForUsers).to.have.been.calledWith([123, 234]);
        expect(wsserver.ioHelper.getUserId).to.have.been.called;
        done();
      });
    });
  });
});
