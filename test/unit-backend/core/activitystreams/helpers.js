'use strict';

var expect = require('chai').expect;

describe('The activitystreams helper module', function() {

  describe('getURN fn', function() {

    it('should return a string urn:linagora.com:type:value', function(done) {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');
      expect(helper.getURN('foo', 'bar')).to.equal('urn:linagora.com:foo:bar');
      done();
    });

  });

  describe('getUserAsActor fn', function() {

    it('should return empty hash when user is not set', function(done) {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');
      expect(helper.getUserAsActor()).to.deep.equal({});
      done();
    });

    it('should return a actor compliant hash', function(done) {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');
      var user = {
        _id: 123,
        firstname: 'foo',
        lastname: 'bar'
      };
      var result = helper.getUserAsActor(user);
      expect(result.objectType).to.equal('user');
      expect(result._id).to.equal(user._id);
      expect(result.image).to.exist;
      expect(result.displayName).to.exist;
      done();
    });
  });

  describe('timelineToActivity fn', function() {

    it('should return an activity', function(done) {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');
      var input = {
        _id: '123',
        verb: 'post',
        language: 'fr',
        published: new Date(),
        actor: {
          objectType: 'user',
          _id: 456,
          image: '789',
          displayName: 'Foo Bar'
        },
        object: {
          objectType: 'whatsup',
          _id: '234'
        },
        target: [{
          objectType: 'activitystream',
          _id: '567'
        }]
      };

      var out = helper.timelineToActivity(input);
      expect(out).to.exist;
      expect(out.actor).to.exist;
      expect(out.actor.id).to.equal('urn:linagora.com:user:' + input.actor._id);
      expect(out.object).to.exist;
      expect(out.object.id).to.equal('urn:linagora.com:whatsup:' + input.object._id);
      expect(out.target.length).to.equal(1);
      expect(out.target[0].id).to.equal('urn:linagora.com:activitystream:' + input.target[0]._id);
      done();
    });

    it('should correctly format the inReplyTo part', function(done) {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');
      var input = {
        _id: '123',
        verb: 'post',
        language: 'fr',
        published: new Date(),
        actor: {
          objectType: 'user',
          _id: 456,
          image: '789',
          displayName: 'Foo Bar'
        },
        object: {
          objectType: 'whatsup',
          _id: '234'
        },
        target: [{
          objectType: 'activitystream',
          _id: '567'
        }],
        inReplyTo: [{
          objectType: 'whatsup',
          _id: '0987654321'
        }]
      };

      var out = helper.timelineToActivity(input);
      expect(out).to.exist;
      expect(out.inReplyTo).to.have.length(1);
      expect(out.inReplyTo[0].id).to.equal('urn:linagora.com:whatsup:0987654321');
      expect(out.inReplyTo[0]._id).to.equal('0987654321');
      expect(out.inReplyTo[0].objectType).to.equal('whatsup');
      done();
    });

    it('should support an empty inReplyTo part', function(done) {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');
      var input = {
        _id: '123',
        verb: 'post',
        language: 'fr',
        published: new Date(),
        actor: {
          objectType: 'user',
          _id: 456,
          image: '789',
          displayName: 'Foo Bar'
        },
        object: {
          objectType: 'whatsup',
          _id: '234'
        },
        target: [{
          objectType: 'activitystream',
          _id: '567'
        }]
      };

      var out = helper.timelineToActivity(input);
      expect(out).to.exist;
      expect(out.inReplyTo).to.not.be.ok;
      done();
    });

    it('should support a to part', function() {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');
      var input = {
        _id: '123',
        verb: 'post',
        language: 'fr',
        published: new Date(),
        actor: {
          objectType: 'user',
          _id: 456,
          image: '789',
          displayName: 'Foo Bar'
        },
        object: {
          objectType: 'whatsup',
          _id: '234'
        },
        target: [{
          objectType: 'activitystream',
          _id: '567'
        }],
        to: [{objectType: 'company', id: 'linagora'}]
      };

      var out = helper.timelineToActivity(input);
      expect(out).to.exist;
      expect(out.to).to.be.ok;
      expect(out.to).deep.to.equal(input.to);
    });
  });

  describe('userMessageToTimelineEntry fn', function() {

    it('should return a timeline entry', function(done) {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');

      var user = {
        firstName: 'foo',
        lastName: 'bar',
        currentAvatar: '123',
        _id: '456'
      };

      var message = {
        _id: 123,
        objectType: 'whatsup',
        language: 'en',
        content: 'yolo !',
        published: new Date(),
        author: user._id,
        shares: [
          {
            objectType: 'activitystream',
            _id: 111
          },
          {
            objectType: 'user',
            _id: 222
          }
        ],
        recipients: [{objectType: 'company', id: 'linagora'}]
      };

      var targets = [
        {
          objectType: 'activitystream',
          _id: 111111
        },
        {
          objectType: 'user',
          _id: 222222
        },
        {
          objectType: 'user',
          _id: 3333333
        }
      ];

      var out = helper.userMessageToTimelineEntry(message, 'post', user, targets);
      expect(out).to.exist;
      expect(out.actor).to.exist;
      expect(out.object).to.exist;
      expect(out.target).to.exist;
      expect(out.target.length).to.equal(3);
      expect(out.target).to.deep.equal(targets);
      expect(out.published).to.exist;
      expect(out.to).to.exist;
      expect(out.to).deep.equal(message.recipients);
      done();
    });
  });

  describe('saveMessageCommentAsActivityEvent fn', function() {

    it('should return a timeline entry', function(done) {
      var helper = require(this.testEnv.basePath + '/backend/core/activitystreams/helpers');

      var user = {
        firstName: 'foo',
        lastName: 'bar',
        currentAvatar: '123',
        _id: '456'
      };

      var comment = {
        _id: 123,
        objectType: 'whatsup',
        language: 'en',
        content: 'yolo !',
        published: new Date(),
        author: user._id,
        shares: [
          {
            objectType: 'activitystream',
            _id: 111
          },
          {
            objectType: 'user',
            _id: 222
          }
        ]
      };

      var targets = [
        {
          objectType: 'activitystream',
          _id: 111111
        },
        {
          objectType: 'user',
          _id: 222222
        },
        {
          objectType: 'user',
          _id: 3333333
        }
      ];

      var inReplyTo = {
        _id: '123456789987654321',
        objectType: 'whatsup'
      };

      var out = helper.userMessageCommentToTimelineEntry(comment, 'post', user, targets, inReplyTo);
      expect(out).to.exist;
      expect(out.actor).to.exist;
      expect(out.object).to.exist;
      expect(out.target).to.exist;
      expect(out.target.length).to.equal(3);
      expect(out.target).to.deep.equal(targets);
      expect(out.published).to.exist;
      expect(out.inReplyTo).to.exist;
      expect(out.inReplyTo.length).to.equal(1);
      expect(out.inReplyTo[0]._id).to.equal(inReplyTo._id);
      expect(out.inReplyTo[0].objectType).to.equal(inReplyTo.objectType);
      done();
    });
  });
});
