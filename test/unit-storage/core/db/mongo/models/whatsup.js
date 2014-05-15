'use strict';

var expect = require('chai').expect;

describe('The Whatsup model', function() {
  var Whatsup, User, Comment, _id;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/whatsup');
    Whatsup = this.mongoose.model('Whatsup');
    Comment = this.mongoose.model('Comment');
    User = this.mongoose.model('User');
    var user = new User({ firstname: 'foo', lastname: 'bar', emails: ['foo@linagora.com', 'bar@linagora.com']});
    this.mongoose.connect(this.testEnv.mongoUrl, function() {
      user.save(function(err, saved) {
        _id = saved._id;
        done();
      });
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('should remove responses and shares and add a _id to new responses', function(done) {
    var newWhatsup = {
      objectType: 'whatsup',
      content: 'Hey, whatsup !',
      author: _id,
      responses: []
    };
    var newComment = {
      objectType: 'whatsup',
      content: 'Hey, comment !',
      author: _id,
      share: [{
        objectType: 'whatsup',
        id: '123'
      }],
      responses: []
    };

    var whatsup = new Whatsup(newWhatsup);
    whatsup.save(function(err, saved) {
      expect(err).not.to.exist;
      saved.responses.push(new Comment(newComment));
      saved.save(function(err, newSaved) {
        expect(newSaved.responses[0].responses).not.to.exist;
        expect(newSaved.responses[0].shares).not.to.exist;
        expect(newSaved.responses[0]._id).to.exist;
        done();
      });
    });
  });

});
