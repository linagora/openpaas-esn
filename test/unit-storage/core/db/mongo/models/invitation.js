'use strict';

var expect = require('chai').expect;

describe('The Invitation model', function() {
  var Invitation;

  beforeEach(function() {
    var mongoose = require('mongoose');
    mongoose.connect(this.testEnv.mongoUrl);
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
    Invitation = mongoose.model('Invitation');
  });

  it('should save the invitation with any data', function(done) {
    var json = {
      type: 'email',
      data: {
        foo: 'bar'
      }
    };
    var i = new Invitation(json);
    i.save(function(err, data) {
      expect(err).to.not.exist;
      expect(data.data).to.exist;
      expect(data.data.foo).to.equal('bar');
      done();
    });
  });

  it('should load the invitation from uuid', function(done) {
    var json = {
      type: 'email',
      data: {
        foo: 'bar'
      }
    };
    var i = new Invitation(json);
    i.save(function(err, data) {
      if (err) {
        done(err);
      }
      Invitation.loadFromUUID(data.uuid, function(err, invitation) {
        expect(err).to.not.exist;
        expect(invitation).to.exist;
        done();
      });
    });
  });

  describe('The finalize method', function() {
    it('should set the date in the invitation', function(done) {
      var json = {
        type: 'email',
        data: {
          foo: 'bar'
        }
      };
      var i = new Invitation(json);
      i.save(function(err, data) {
        expect(err).to.not.exist;

        i.finalize(function(err, data) {
          expect(err).to.not.exist;
          expect(data).to.exist;
          expect(data.timestamps.finalized).to.exist;
          done();
        });
      });
    });
  });

  describe('The isFinalized static method', function() {
    it('should return true when finalized timestamp is set', function(done) {
      var json = {
        type: 'email',
        timestamps: {
          finalized: new Date()
        },
        data: {
          foo: 'bar'
        }
      };

      var i = new Invitation(json);
      i.save(function(err, data) {
        expect(err).to.not.exist;
        Invitation.isFinalized(data.uuid, function(err, finalized) {
          expect(err).to.not.exist;
          expect(finalized).to.be.true;
          done();
        });
      });
    });

    it('should return false when finalized timestamp is not set', function(done) {
      var json = {
        type: 'email',
        timestamps: {
        },
        data: {
          foo: 'bar'
        }
      };

      var i = new Invitation(json);
      i.save(function(err, data) {
        expect(err).to.not.exist;
        Invitation.isFinalized(data.uuid, function(err, finalized) {
          expect(err).to.not.exist;
          expect(finalized).to.be.false;
          done();
        });
      });
    });
  });

  afterEach(function(done) {
    var callback = function(item, fn) {
      item.remove(fn);
    };

    var async = require('async');
    async.parallel([
      function(cb) {
        Invitation.find().exec(function(err, invitations) {
          async.forEach(invitations, callback, cb);
        });
      }
    ], function() {
      var mongoose = require('mongoose');
      mongoose.disconnect(done);
    });
  });
});
