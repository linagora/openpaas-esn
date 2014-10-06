'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');

describe('The core user notifications module', function() {
  describe('The getForUser fn', function() {

    it('should call mongoose with valid parameters', function(done) {

      var user = {_id: 123};
      var query = {offset: 1, limit: 2, read: true};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            find: function(q) {

              expect(q).to.exist;
              expect(q['target.objectType']).to.exist;
              expect(q['target.objectType']).to.equal('user');
              expect(q['subject.id']).to.exist;
              expect(q['subject.id']).to.equal(user._id);
              expect(q.read).to.be.true;

              return {
                limit: function(value) {
                  expect(value).to.equal(query.limit);
                },
                skip: function(value) {
                  expect(value).to.equal(query.offset);
                },
                sort: function(value) {
                  expect(value).to.equal('-timestamps.creation');
                },
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/notification/user');
      module.getForUser(user, query, done);
    });

    it('should call mongoose without read in query', function(done) {

      var user = {_id: 123};
      var query = {offset: 1, limit: 2};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            find: function(q) {

              expect(q).to.exist;
              expect(q['target.objectType']).to.exist;
              expect(q['target.objectType']).to.equal('user');
              expect(q['subject.id']).to.exist;
              expect(q['subject.id']).to.equal(user._id);
              expect(q.read).to.be.undefined;

              return {
                limit: function(value) {
                  expect(value).to.equal(query.limit);
                },
                skip: function(value) {
                  expect(value).to.equal(query.offset);
                },
                sort: function(value) {
                  expect(value).to.equal('-timestamps.creation');
                },
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/notification/user');
      module.getForUser(user, query, done);
    });
  });

  describe('The count fn', function() {

    it('should call mongoose with valid parameters', function(done) {
      var user = {_id: 123};
      var query = {offset: 1, limit: 2, read: true};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            count: function(q) {

              expect(q).to.exist;
              expect(q['target.objectType']).to.exist;
              expect(q['target.objectType']).to.equal('user');
              expect(q['subject.id']).to.exist;
              expect(q['subject.id']).to.equal(user._id);
              expect(q.read).to.be.true;

              return {
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/notification/user');
      module.countForUser(user, query, done);
    });

    it('should call mongoose without the read parameters', function(done) {
      var user = {_id: 123};
      var query = {offset: 1, limit: 2};

      mockery.registerMock('mongoose', {
        model: function() {
          return {
            count: function(q) {

              expect(q).to.exist;
              expect(q['target.objectType']).to.exist;
              expect(q['target.objectType']).to.equal('user');
              expect(q['subject.id']).to.exist;
              expect(q['subject.id']).to.equal(user._id);
              expect(q.read).to.be.undefined;

              return {
                exec: function(callback) {
                  return callback();
                }
              };
            }
          };
        }
      });

      var module = require(this.testEnv.basePath + '/backend/core/notification/user');
      module.countForUser(user, query, done);
    });
  });
});
