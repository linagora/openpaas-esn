'use strict';

var expect = require('chai').expect,
  mongoose = require('mongoose');

describe('The Invitation model', function() {
  var Invitation;

  before(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
  });

  beforeEach(function() {
    mongoose.connect(this.testEnv.mongoUrl);
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
      mongoose.disconnect(done);
    });
  });
});
