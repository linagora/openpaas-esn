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
        ]
      };

      var out = helper.userMessageToTimelineEntry(message, 'post', user);
      expect(out).to.exist;
      expect(out.actor).to.exist;
      expect(out.object).to.exist;
      expect(out.target).to.exist;
      expect(out.target.length).to.equal(2);
      done();
    });
  });
});
