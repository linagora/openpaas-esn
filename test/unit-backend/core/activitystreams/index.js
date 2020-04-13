'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activity streams core module', function() {
  describe('The getUserStreams fn', function() {

    it('should send back error when user is null', function(done) {
      this.helpers.mock.models({});

      var module = this.helpers.requireBackend('core/activitystreams/index');
      module.getUserStreams(null, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should not fail when domain.getUserDomains and collaboration.getStreamsForUser fail', function(done) {
      this.helpers.mock.models({});
      mockery.registerMock('../user/domain', {
        getUserDomains: function(user, cb) {
          return cb(new Error());
        }
      });
      mockery.registerMock('../collaboration', {
        getStreamsForUser: function(user, options, cb) {
          return cb(new Error());
        }
      });

      var module = this.helpers.requireBackend('core/activitystreams/index');
      module.getUserStreams({_id: 123}, {}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.length).to.equal(0);
        done();
      });
    });

    it('should send back streams from user collaborations', function(done) {
      var streams = [
        {
          uuid: 222
        },
        {
          uuid: 444
        }
      ];
      this.helpers.mock.models({});
      mockery.registerMock('../user/domain', {
        getUserDomains: function(user, cb) {
          return cb();
        }
      });
      mockery.registerMock('../collaboration', {
        getStreamsForUser: function(user, options, cb) {
          return cb(null, streams);
        }
      });

      var module = this.helpers.requireBackend('core/activitystreams/index');
      module.getUserStreams({_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.length).to.equal(2);
        done();
      });
    });

    it('should send back streams from collaborations', function(done) {
      var streams = [
        {
          uuid: 222
        },
        {
          uuid: 444
        }
      ];
      this.helpers.mock.models({});
      mockery.registerMock('../collaboration', {
        getStreamsForUser: function(user, options, cb) {
          return cb(null, streams);
        }
      });

      var module = this.helpers.requireBackend('core/activitystreams/index');
      module.getUserStreams({_id: 123}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.exist;
        expect(result.length).to.equal(2);
        done();
      });
    });
  });

  describe('getTimelineEntryFromStreamMessage', function() {
    it('should send back error when activitystream is undefined', function(done) {
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/activitystreams/index');
      module.getTimelineEntryFromStreamMessage(null, {}, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back error when message is undefined', function(done) {
      this.helpers.mock.models({});
      var module = this.helpers.requireBackend('core/activitystreams/index');
      module.getTimelineEntryFromStreamMessage({}, null, function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should call TimelineEntry.findOne', function(done) {
      var message = {_id: 1, objectType: 'whatsup'};
      var stream = {uuid: 123456};
      var expected = {
        target: {
          objectType: 'activitystream',
          _id: stream.uuid

        },
        object: {
          objectType: message.objectType,
          _id: message._id
        }
      };

      this.helpers.mock.models({
        TimelineEntry: {
          findOne: function(query) {
            expect(query).to.deep.equal(expected);
            done();
          }
        }
      });
      var module = this.helpers.requireBackend('core/activitystreams/index');
      module.getTimelineEntryFromStreamMessage(stream, message);
    });

  });

  describe('getTimelineEntries function', function() {
    it('should call TimelineEntry.find with right query when object is provided', function(done) {
      const object = { _id: 1, objectType: 'test' };
      const expected = [{
        'object._id': object._id,
        'object.objectType': object.objectType
      }];

      this.helpers.mock.models({
        TimelineEntry: {
          find: () => ({
            or: orQuery => {
              expect(orQuery).to.deep.equal(expected);
              done();
            }
          })
        }
      });
      const module = this.helpers.requireBackend('core/activitystreams/index');

      module.getTimelineEntries({ object });
    });

    it('should call TimelineEntry.find with right query when sort option is not provided', function(done) {
      this.helpers.mock.models({
        TimelineEntry: {
          find: () => ({
            or: () => ({
              count: () => ({
                exec: callback => callback()
              }),
              sort: sortQuery => {
                expect(sortQuery).to.deep.equal({ published: -1 });
                done();
              }
            })
          })
        }
      });
      const module = this.helpers.requireBackend('core/activitystreams/index');

      module.getTimelineEntries({});
    });

    it('should call TimelineEntry.find with right query when sort option is provided', function(done) {
      const options = {
        sort: { customField: 1 }
      };

      this.helpers.mock.models({
        TimelineEntry: {
          find: () => ({
            or: () => ({
              count: () => ({
                exec: callback => callback()
              }),
              sort: sortQuery => {
                expect(sortQuery).to.deep.equal(options.sort);
                done();
              }
            })
          })
        }
      });
      const module = this.helpers.requireBackend('core/activitystreams/index');

      module.getTimelineEntries(options);
    });
  });
});
