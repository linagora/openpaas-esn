'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The notification pubsub module', function() {

  it('should subscribe to community:join', function() {
    var localstub = {};
    this.helpers.mock.pubsub('../pubsub', localstub, {});
    mockery.registerMock('./usernotification', {});

    var module = require(this.testEnv.basePath + '/backend/core/notification/pubsub');
    module.init();
    expect(localstub.topics['community:join'].handler).to.be.a.function;
  });

  describe('communityJoinHandler method', function() {

    it('should subscribe to community:join, save a augmented usernotification then forward it into global usernotification:created', function(done) {
      var globalstub = {};
      var datastub = {};
      var data = {
        author: '123',
        target: '456',
        community: '789'
      };
      var usernotificationMocked = {
        addUserNotification: function(data, callback) {
          datastub = data;
          callback(null, 'saved');
        }
      };

      this.helpers.mock.pubsub('../pubsub', {}, globalstub);
      mockery.registerMock('./usernotification', usernotificationMocked);

      var module = require(this.testEnv.basePath + '/backend/core/notification/pubsub');
      module.communityJoinHandler(data, function(err) {
        if (err) {
          return done(err);
        }
        expect(datastub).to.deep.equal({
          subject: {objectType: 'user', id: '123'},
          verb: {label: 'ESN_COMMUNITY_JOIN', text: 'has join'},
          complement: {objectType: 'community', id: '789'},
          context: null,
          description: null,
          icon: {objectType: 'icon', id: 'fa-users'},
          category: 'community:join',
          target: [{objectType: 'community', id: '789'}]
        });
        expect(globalstub.topics['usernotification:created'].data[0]).to.equal('saved');
        done();
      });
    });

  });
});
