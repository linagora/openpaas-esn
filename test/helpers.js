'use strict';

var async = require('async'),
    expect = require('chai').expect,
    MongoClient = require('mongodb').MongoClient,
    mockery = require('mockery');

/*
 * Mocks esnConf(<key>) object.
 * get: callback of the esnConf(<key>).get(get) method.
 */
function mockEsnConfig(get) {
  var mockedEsnConfig = {
    'esn-config': function() {
      return {
        get: get
      };
    }
  };
  var mockedEsnConfigFunction = function() {
    return {
      get: get
    };
  };
  mockery.registerMock('../../core', mockedEsnConfig);
  mockery.registerMock('../esn-config', mockedEsnConfigFunction);
}

/*
 * mockedModels = {
 *   'User': function User() {
 *     ...
 *   },
 *   'Domain': function Domain() {
 *     ...
 *   }
 * }
 *
 */
function mockModels(mockedModels) {
  var mongooseMock = {
    model: function(model) {
      return mockedModels[model];
    }
  };
  mockery.registerMock('mongoose', mongooseMock);
}

/*
 * stub.topics is an Array which contains every topic.
 * stub.topics[topic].data is an Array named topic and contains every published data for the 'topic' topic.
 * stub.topics[topic].handler is the handler for the 'topic' topic.
 */
function mockPubSub(path, localStub, globalStub) {
  localStub.topics = [];
  localStub.subscribe = {};
  globalStub.topics = [];
  globalStub.subscribe = {};

  var mockedPubSub = {
    local: {
      topic: function(topic) {
        localStub.topics.push(topic);
        localStub.topics[topic] = {
          data: [],
          handler: {}
        };
        return {
          publish: function(data) {
            localStub.topics[topic].data.push(data);
          },
          subscribe: function(handler) {
            localStub.topics[topic].handler = handler;
          }
        };
      }
    },
    global: {
      topic: function(topic) {
        globalStub.topics.push(topic);
        globalStub.topics[topic] = {
          data: [],
          handler: {}
        };
        return {
          publish: function(data) {
            globalStub.topics[topic].data.push(data);
          },
          subscribe: function(handler) {
            globalStub.topics[topic].handler = handler;
          }
        };
      }
    }
  };

  mockery.registerMock(path, mockedPubSub);
}

module.exports = function(mixin, testEnv) {
  mixin.mongo = {
    connect: function(callback) {
      require('mongoose').connect(testEnv.mongoUrl, callback);
    },
    disconnect: function(callback) {
      require('mongoose').disconnect(callback);
    },
    dropDatabase: function(callback) {
      MongoClient.connect(testEnv.mongoUrl, function(err, db) {
        db.dropDatabase(function(err) {
          db.close(function() {});
          callback(err);
        });
      });
    },
    clearCollection: function(collectionName, callback) {
      require('mongoose').connection.db.collection(collectionName).remove(callback);
    },
    dropCollections: function(callback) {
      require('mongoose').connection.db.collections(function(err, collections) {
        if (err) { return callback(err); }
        collections = collections.filter(function(collection) {
          return collection.collectionName !== 'system.indexes';
        });
        async.forEach(collections, function(collection, done) {
          require('mongoose').connection.db.dropCollection(collection.collectionName, done);
        }, callback);
      });
    },
    saveDoc: function(collection, doc, done) {
      MongoClient.connect(testEnv.mongoUrl, function(err, db) {
        function close(err) { db.close(function() { done(err); }); }

        if (err) { return done(err); }

        db.collection(collection).save(doc, close);
      });
    },
    /*
    *check a mongodb document
    * @param collection string - the mongodb collection to get the doc
    * @param id string|object - the doc _id (string) or the find criteria (object)
    * @param check function|object - the function that checks the doc (function). This function should return something in case of error
    *                                or the doc to check against (object)
    * @param done function - the callback. No arguments on success, error on error
    */
    checkDoc: function(collection, id, check, done) {
      MongoClient.connect(testEnv.mongoUrl, function(err, db) {

        function close(err) {
          db.close(function() {
            done(err);
          });
        }

        if (err) {
          return done(err);
        }

        if (typeof id === 'string') {
          id = {_id: id};
        }

        db.collection(collection).findOne(id, function(err, doc) {
          if (err) {
            return close(err);
          }
          expect(doc).to.exist;

          if (typeof check === 'function') {
            var checkErr = check(doc);
            if (checkErr) {
              return close(checkErr);
            }
          } else {
            doc = JSON.parse(JSON.stringify(doc));
            expect(doc).to.deep.equal(check);
          }

          close();
        });
      });
    }
  };

  mixin.mock = {
    models: mockModels,
    pubsub: mockPubSub,
    esnConfig: mockEsnConfig
  };
};
