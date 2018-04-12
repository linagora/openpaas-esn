'use strict';

const chai = require('chai');
const expect = chai.expect;
const mockery = require('mockery');

describe('The notification pubsub module', function() {

  beforeEach(function() {
    this.helpers.mock.models({});
  });

  it('should subscribe to collaboration:join', function() {
    const localstub = {};

    this.helpers.mock.pubsub('../pubsub', localstub, {});
    mockery.registerMock('../notification', {usernotification: {}});

    const module = this.helpers.requireBackend('core/collaboration/usernotification')();

    module.init();

    expect(localstub.topics['collaboration:join'].handler).to.be.a.function;
  });

  describe('The collaborationJoinHandler function', function() {
    it('should save a augmented usernotification', function(done) {
      let datastub = {};
      const data = {
        author: '123',
        target: '456',
        collaboration: {objectType: 'community', id: '789'},
        actor: 'manager'
      };
      const usernotificationMocked = {
        create: function(data, callback) {
          datastub = data;
          callback(null, 'saved');
        }
      };

      mockery.registerMock('../notification', {usernotification: usernotificationMocked});

      const module = this.helpers.requireBackend('core/collaboration/usernotification')();

      module.collaborationJoinHandler(data, function(err) {
        if (err) {
          return done(err);
        }

        expect(datastub).to.deep.equal({
          subject: {objectType: 'user', id: '123'},
          verb: {label: 'ESN_MEMBERSHIP_ACCEPTED', text: 'accepted your request to join'},
          complement: {objectType: 'community', id: '789'},
          context: null,
          description: null,
          icon: {objectType: 'icon', id: 'mdi-account-multiple'},
          category: 'collaboration:membership:accepted',
          read: false,
          interactive: false,
          target: data.target
        });
        done();
      });
    });

  });

  describe('The membershipInviteHandler function', function() {
    it('should save a augmented usernotification', function(done) {
      const globalstub = {};
      let datastub = {};
      const data = {
        author: '123',
        target: '456',
        collaboration: {objectType: 'community', id: '789'}
      };
      const usernotificationMocked = {
        create: function(data, callback) {
          datastub = data;
          callback(null, 'saved');
        }
      };

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);
      mockery.registerMock('../notification', {usernotification: usernotificationMocked});

      const module = this.helpers.requireBackend('core/collaboration/usernotification')();

      module.membershipInviteHandler(data, function(err) {
        if (err) {
          return done(err);
        }

        expect(datastub).to.deep.equal({
          subject: {objectType: 'user', id: '123'},
          verb: {label: 'ESN_MEMBERSHIP_INVITE', text: 'has invited you in'},
          complement: {objectType: 'community', id: '789'},
          context: null,
          description: null,
          icon: {objectType: 'icon', id: 'mdi-account-multiple'},
          category: 'collaboration:membership:invite',
          interactive: true,
          target: data.target
        });
        done();
      });
    });
  });
});
