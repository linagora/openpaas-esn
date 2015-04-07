'use strict';

var chai = require('chai');
var expect = chai.expect;
var async = require('async');

describe('The activitystreams core module', function() {

  it('query should send back error when options is undefined', function(done) {
    this.helpers.mock.models({});

    var timeline = this.helpers.requireBackend('core/activitystreams');
    timeline.query(null, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('query should send back error when options.target is undefined', function(done) {
    this.helpers.mock.models({});

    var timeline = this.helpers.requireBackend('core/activitystreams');
    timeline.query({}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  describe('the query fn', function() {
    var Domain, TimelineEntry, User, Community;

    beforeEach(function(done) {
      this.mongoose = require('mongoose');
      this.helpers.requireBackend('core/db/mongo/models/timelineentry');
      this.helpers.requireBackend('core/db/mongo/models/read-timelineentriestracker');
      this.helpers.requireBackend('core/db/mongo/models/domain');
      this.helpers.requireBackend('core/db/mongo/models/user');
      this.helpers.requireBackend('core/db/mongo/models/community');
      this.helpers.requireBackend('core/db/mongo/models/usernotification');
      this.testEnv.writeDBConfigFile();
      Domain = this.mongoose.model('Domain');
      TimelineEntry = this.mongoose.model('TimelineEntry');
      User = this.mongoose.model('User');
      Community = this.mongoose.model('Community');

      this.mongoose.connect(this.testEnv.mongoUrl, done);
    });

    afterEach(function(done) {
      this.testEnv.removeDBConfigFile();
      this.mongoose.connection.db.dropDatabase();
      this.mongoose.disconnect(done);
    });

    it('should return all the entries with the given target', function(done) {
      var domain = {
        name: 'MyAwesomeDomainForTest',
        company_name: 'LinagoraOSS'
      };

      var self = this;

      var createTimelineEntry = function(domain, callback) {
        var e = new TimelineEntry({
          verb: 'post',
          language: 'en',
          actor: {
            objectType: 'user',
            _id: self.mongoose.Types.ObjectId(),
            image: '123456789',
            displayName: 'foo bar baz'
          },
          object: {
            objectType: 'message',
            _id: self.mongoose.Types.ObjectId()
          },
          target: [
            {
              objectType: 'domain',
              _id: domain._id
            }
          ]
        });
        e.save(callback);
      };

      var createTimelineEntryJob = function(callback) {
        createTimelineEntry(domain, callback);
      };

      var d = new Domain(domain);
      d.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        domain._id = saved._id;

        async.series(
          [createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob],
          function(err) {
            if (err) {
              return done(err);
            }

            var timeline = self.helpers.requireBackend('core/activitystreams');
            timeline.query({target: {objectType: 'domain', _id: domain._id}}, function(err, result) {
              expect(err).to.not.exist;
              expect(result).to.exist;
              expect(result.length).to.equal(5);
              done();
            });
          }
        );
      });
    });

    it('should return the number of entries defined in the limit field', function(done) {
      var domain = {
        name: 'MyAwesomeDomainForTest',
        company_name: 'LinagoraOSS'
      };

      var self = this;

      var createTimelineEntry = function(domain, callback) {
        var e = new TimelineEntry({
          verb: 'post',
          language: 'en',
          actor: {
            objectType: 'user',
            _id: self.mongoose.Types.ObjectId(),
            image: '123456789',
            displayName: 'foo bar baz'
          },
          object: {
            objectType: 'message',
            _id: self.mongoose.Types.ObjectId()
          },
          target: [
            {
              objectType: 'domain',
              _id: domain._id
            }
          ]
        });
        e.save(callback);
      };
      var createTimelineEntryJob = function(callback) {
        createTimelineEntry(domain, callback);
      };

      var d = new Domain(domain);
      d.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        domain._id = saved._id;

        async.series(
          [createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob],
          function(err) {
            if (err) {
              return done(err);
            }

            var limit = 2;

            var timeline = self.helpers.requireBackend('core/activitystreams');
            timeline.query({limit: limit, target: {objectType: 'domain', _id: domain._id}}, function(err, result) {
              expect(err).to.not.exist;
              expect(result).to.exist;
              expect(result.length).to.equal(limit);
              done();
            });
          }
        );
      });
    });

    it('should return the entries before a given one', function(done) {
      var domain = {
        name: 'MyAwesomeDomainForTest',
        company_name: 'LinagoraOSS'
      };
      var limitEntry = null;
      var limitEntries = [];

      var self = this;

      var createTimelineEntry = function(domain, before, callback) {
        var e = new TimelineEntry({
          verb: 'post',
          language: 'en',
          actor: {
            objectType: 'user',
            _id: self.mongoose.Types.ObjectId(),
            image: '123456789',
            displayName: 'foo bar baz'
          },
          object: {
            objectType: 'message',
            _id: self.mongoose.Types.ObjectId()
          },
          target: [
            {
              objectType: 'domain',
              _id: domain._id
            }
          ]
        });
        e.save(function(err, saved) {
          // save all the entries before the limit for later test
          if (!limitEntry && !before) {
            limitEntries.push(saved);
          }
          if (before) {
            limitEntry = saved;
          }
          callback(err, saved);
        });
      };

      var createTimelineEntryJob = function(callback) {
        createTimelineEntry(domain, false, callback);
      };

      var d = new Domain(domain);
      d.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        domain._id = saved._id;

        async.series(
          [createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob, function(callback) {
            createTimelineEntry(domain, true, callback);
          }, createTimelineEntryJob],
          function(err) {
            if (err) {
              return done(err);
            }

            var timeline = self.helpers.requireBackend('core/activitystreams');
            timeline.query({before: limitEntry._id, target: {objectType: 'domain', _id: domain._id}}, function(err, result) {
              expect(err).to.not.exist;
              expect(result).to.exist;
              expect(result.length).to.equal(limitEntries.length);
              expect(result[0]._id.equals(limitEntries[2]._id)).to.be.true;
              expect(result[1]._id.equals(limitEntries[1]._id)).to.be.true;
              expect(result[2]._id.equals(limitEntries[0]._id)).to.be.true;
              done();
            });
          }
        );
      });
    });


    it('should return the entries before a given one with the right number defined by limit', function(done) {
      var domain = {
        name: 'MyAwesomeDomainForTestLimit',
        company_name: 'LinagoraOSS'
      };
      var limitEntry = null;
      var limitEntries = [];

      var self = this;

      var createTimelineEntry = function(domain, before, callback) {
        var e = new TimelineEntry({
          verb: 'post',
          language: 'en',
          actor: {
            objectType: 'user',
            _id: self.mongoose.Types.ObjectId(),
            image: '123456789',
            displayName: 'foo bar baz'
          },
          object: {
            objectType: 'message',
            _id: self.mongoose.Types.ObjectId()
          },
          target: [
            {
              objectType: 'domain',
              _id: domain._id
            }
          ]
        });

        e.published = new Date();
        e.save(function(err, saved) {
          // save all the entries before the limit for later test
          if (!limitEntry && !before) {
            limitEntries.push(saved);
          }
          if (before) {
            limitEntry = saved;
          }
          callback(err, saved);
        });
      };

      var createTimelineEntryJob = function(callback) {
        createTimelineEntry(domain, false, callback);
      };

      var d = new Domain(domain);
      d.save(function(err, saved) {
        if (err) {
          return done(err);
        }
        domain._id = saved._id;

        async.series([createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob, function(callback) {
          createTimelineEntry(domain, true, callback);
          }, createTimelineEntryJob],
          function(err) {
            if (err) {
              return done(err);
            }

            var timeline = self.helpers.requireBackend('core/activitystreams');
            timeline.query({before: limitEntry._id, limit: 2, target: {objectType: 'domain', _id: domain._id}}, function(err, result) {

              expect(err).to.not.exist;
              expect(result).to.exist;
              expect(result.length).to.equal(2);
              expect(result[0]._id).to.deep.equal(limitEntries[2]._id);
              expect(result[1]._id).to.deep.equal(limitEntries[1]._id);
              done();
            });
          }
        );
      });
    });

    describe('"after" parameter', function() {
      it('should send back the activities that are published after the specified activity', function(done) {
        var domain = {
          name: 'MyAwesomeDomainForTestLimit',
          company_name: 'LinagoraOSS'
        };
        var limitEntry = null;
        var limitEntries = [];

        var self = this;

        var createTimelineEntry = function(domain, before, callback) {
          var e = new TimelineEntry({
            verb: 'post',
            language: 'en',
            actor: {
              objectType: 'user',
              _id: self.mongoose.Types.ObjectId(),
              image: '123456789',
              displayName: 'foo bar baz'
            },
            object: {
              objectType: 'message',
              _id: self.mongoose.Types.ObjectId()
            },
            target: [
              {
                objectType: 'domain',
                _id: domain._id
              }
            ]
          });

          e.published = new Date();
          e.save(function(err, saved) {
            // save all the entries before the limit for later test
            if (!before) {
              limitEntries.push(saved);
            } else {
              limitEntry = saved;
            }
            callback(err, saved);
          });
        };

        var createTimelineEntryJob = function(callback) {
          createTimelineEntry(domain, false, callback);
        };


        var d = new Domain(domain);
        d.save(function(err, saved) {
          if (err) {
            return done(err);
          }
          domain._id = saved._id;

          async.series([createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob, function(callback) {
            createTimelineEntry(domain, true, callback);
            }, createTimelineEntryJob, createTimelineEntryJob],
            function(err) {
              if (err) {
                return done(err);
              }

              var timeline = self.helpers.requireBackend('core/activitystreams');
              timeline.query({after: limitEntry._id, target: {objectType: 'domain', _id: domain._id}}, function(err, result) {
                expect(err).to.not.exist;
                expect(result).to.exist;
                expect(result.length).to.equal(2);
                expect(result[0]._id).to.deep.equal(limitEntries[3]._id);
                expect(result[1]._id).to.deep.equal(limitEntries[4]._id);
                done();
              });
            }
          );

        });
      });

      it('should respect the limit option', function(done) {
        var domain = {
          name: 'MyAwesomeDomainForTestLimit',
          company_name: 'LinagoraOSS'
        };
        var limitEntry = null;
        var limitEntries = [];

        var self = this;

        var createTimelineEntry = function(domain, before, callback) {
          var e = new TimelineEntry({
            verb: 'post',
            language: 'en',
            actor: {
              objectType: 'user',
              _id: self.mongoose.Types.ObjectId(),
              image: '123456789',
              displayName: 'foo bar baz'
            },
            object: {
              objectType: 'message',
              _id: self.mongoose.Types.ObjectId()
            },
            target: [
              {
                objectType: 'domain',
                _id: domain._id
              }
            ]
          });

          e.published = new Date();
          e.save(function(err, saved) {
            // save all the entries before the limit for later test
            if (!before) {
              limitEntries.push(saved);
            } else {
              limitEntry = saved;
            }
            callback(err, saved);
          });
        };

        var createTimelineEntryJob = function(callback) {
          createTimelineEntry(domain, false, callback);
        };


        var d = new Domain(domain);
        d.save(function(err, saved) {
          if (err) {
            return done(err);
          }
          domain._id = saved._id;

          async.series([createTimelineEntryJob, function(callback) {
            createTimelineEntry(domain, true, callback);
            }, createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob, createTimelineEntryJob],
            function(err) {
              if (err) {
                return done(err);
              }

              var timeline = self.helpers.requireBackend('core/activitystreams');
              timeline.query({after: limitEntry._id, target: {objectType: 'domain', _id: domain._id}, limit: 2}, function(err, result) {
                expect(err).to.not.exist;
                expect(result).to.exist;
                expect(result.length).to.equal(2);
                expect(result[0]._id).to.deep.equal(limitEntries[1]._id);
                expect(result[1]._id).to.deep.equal(limitEntries[2]._id);
                done();
              });
            }
          );

        });
      });

    });

  });

  describe('The addTimelineEntry fn', function() {

    it('should send back error when event is not set', function(done) {
      this.helpers.mock.models({});

      var timeline = this.helpers.requireBackend('core/activitystreams');
      timeline.addTimelineEntry(null, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });
});
