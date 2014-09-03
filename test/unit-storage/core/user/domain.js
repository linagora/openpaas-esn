'use strict';

var expect = require('chai').expect;

describe.skip('The user domain module', function() {

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  describe('Basics tests (list users)', function() {
    beforeEach(function(done) {
      var self = this;
      this.mongoose = require('mongoose');
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) {
          done(err);
        }

        self.helpers.mongo.saveDoc('configuration', {
          _id: 'elasticsearch',
          host: 'localhost:' + self.testEnv.serversConfig.elasticsearch.port
        }, function(err) {
          done(err);
        });
      });
    });

    afterEach(function(done) {
      this.mongoose.connection.db.dropDatabase();
      this.mongoose.disconnect(done);
    });

    it('should return users which belong the the given domain when calling getUsersList', function(done) {
      var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');

      var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

      this.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        var userWithoutDomain = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
        userWithoutDomain.save(function(err) {
          if (err) { done(err); }

          userDomain.getUsersList(models.domain, null, function(err, users) {
            expect(err).to.not.exist;
            expect(users).to.exist;
            expect(users.list.length).to.equal(4);
            done();
          });
        });
      });
    });

    it('should return an array where limit === size when calling getUsersList with limit option', function(done) {
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

      this.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        userDomain.getUsersList(models.domain, {limit: 2}, function(err, users) {
          expect(err).to.not.exist;
          expect(users).to.exist;
          expect(users.list.length).to.equal(2);
          done();
        });
      });
    });

    it('should return an array which contains the last 2 elements when calling getUsersList with offset option = 2 on domain members = 4', function(done) {
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

      this.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        userDomain.getUsersList(models.domain, {offset: 2}, function(err, users) {
          expect(err).to.not.exist;
          expect(users).to.exist;
          expect(users.list.length).to.equal(2);

          expect(users.list[0]._id).to.deep.equals(models.users[2]._id);
          expect(users.list[1]._id).to.deep.equals(models.users[3]._id);
          done();
        });
      });
    });

    it('should return the users which belong to a domain and which contain the search term', function(done) {
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');
      var self = this;

      this.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        var ids = models.users.map(function(element) {
          return element._id;
        });
        self.helpers.elasticsearch.checkUsersDocumentsIndexed(ids, function(err) {
          if (err) { return done(err); }

          userDomain.getUsersSearch(models.domain, {search: 'lng'}, function(err, users) {
            expect(err).to.not.exist;
            expect(users).to.exist;
            expect(users.list.length).to.equal(3);
            expect(users.list[0]._id).to.deep.equals(models.users[0]._id.toString());
            expect(users.list[1]._id).to.deep.equals(models.users[1]._id.toString());
            expect(users.list[2]._id).to.deep.equals(models.users[2]._id.toString());
            done();
          });
        });
      });
    });

    it('should return an error when calling getUsersList with a null domain', function(done) {
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

      userDomain.getUsersList(null, null, function(err, users) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('Tests cases (search users)', function() {
    var User;
    var Domain;
    var domain;

    var userDomain;

    var delphine;
    var philippe;

    before(function(done) {

      var self = this;
      this.mongoose = require('mongoose');
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) { done(err); }

        self.helpers.mongo.saveDoc('configuration', {
          _id: 'elasticsearch',
          host: 'localhost:' + self.testEnv.serversConfig.elasticsearch.port
        }, function(err) {
          if (err) { done(err); }

          User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
          Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');

          self.helpers.api.applyDomainDeployment('linagora_test_cases', function(err, models) {
            if (err) { return done(err); }

            domain = models.domain;
            delphine = models.users[0];
            philippe = models.users[1];

            var ids = models.users.map(function(element) {
              return element._id;
            });
            self.helpers.elasticsearch.checkUsersDocumentsIndexed(ids, function(err) {
              if (err) { return done(err); }
              self.mongoose.disconnect(done);
            });
          });
        });
      });
    });

    after(function(done) {
      var self = this;
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) { done(err); }
        self.mongoose.connection.db.dropDatabase();
        self.mongoose.disconnect(done);
      });
    });

    beforeEach(function(done) {
      User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

      this.mongoose = require('mongoose');
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        done(err);
      });
    });

    afterEach(function(done) {
      this.mongoose.disconnect(done);
    });

    it('should return only Delphine with request "Delp"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'Delp'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Philippe with request "faso"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'faso'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "yrel"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'yrel'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return nothing with request "deckard"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'deckard'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(0);
        done();
      });
    });

    it('should return nothing with request "Rachel Mifasol"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'Rachel Mifasol'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(0);
        done();
      });
    });

    it('should return nothing with request "Delphine interne.com"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'Delphine interne.com'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(0);
        done();
      });
    });

    it('should return Delphine and Philippe with request "phi"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'phi'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(2);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        expect(users.list[1]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return Delphine and Philippe with request "mi"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'mi'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(2);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        expect(users.list[1]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return Delphine and Philippe with request "interne"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'interne'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(2);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        expect(users.list[1]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "Delphine Doremi tyrell@interne.fr"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'Delphine Doremi tyrell@interne.fr'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "Delphine Delphine Doremi"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'Delphine Delphine Doremi'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "emi ern elp"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'emi ern elp'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "Rémi"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'Rémi'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Philippe with request "atty@i"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'atty@i'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "DOREM"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'DOREM'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return Delphine and Philippe with empty request', function(done) {

      userDomain.getUsersList(domain, null, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(2);
        expect(users.list[0]._id.toString()).to.deep.equals(delphine._id.toString());
        expect(users.list[1]._id.toString()).to.deep.equals(philippe._id.toString());
        done();
      });
    });

  });

  describe('Tests cases extra (search users)', function() {
    var User;
    var Domain;
    var domain;

    var userDomain;

    var user;

    before(function(done) {

      var self = this;
      this.mongoose = require('mongoose');
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) { done(err); }

        self.helpers.mongo.saveDoc('configuration', {
          _id: 'elasticsearch',
          host: 'localhost:' + self.testEnv.serversConfig.elasticsearch.port
        }, function(err) {
          if (err) { done(err); }

          User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
          Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');

          userDomain = require(self.testEnv.basePath + '/backend/core/user/domain');

          self.helpers.api.applyDomainDeployment('linagora_test_cases_extra', function(err, models) {
            if (err) { return done(err); }

            domain = models.domain;
            user = models.users[0];

            self.helpers.elasticsearch.checkUsersDocumentsIndexed([user._id], function(err) {
              if (err) { return done(err); }
              self.mongoose.disconnect(done);
            });
          });
        });
      });
    });

    after(function(done) {
      var self = this;
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) {
          done(err);
        }
        self.mongoose.connection.db.dropDatabase();
        self.mongoose.disconnect(done);
      });
    });

    beforeEach(function(done) {
      this.mongoose = require('mongoose');
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        done(err);
      });
    });

    afterEach(function(done) {
      this.mongoose.disconnect(done);
    });

    it('should return the user with request "eeeeaaaaiic"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'eeeeaaaaiic'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(user._id.toString());
        done();
      });
    });

    it('should return the user with request "éèêëaàâäïîç"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'éèêëaàâäïîç'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(user._id.toString());
        done();
      });
    });

    it('should return the user with request "EEEEAAAAIIC"', function(done) {

      userDomain.getUsersSearch(domain, {search: 'EEEEAAAAIIC'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(user._id.toString());
        done();
      });
    });

  });
});
