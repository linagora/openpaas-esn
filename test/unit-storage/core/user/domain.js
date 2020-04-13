'use strict';

var expect = require('chai').expect;

describe('The user domain module', function() {

  function checkIndexResult(res) {
    return res.status === 200 && res.body.hits.total === 1 && res.body.hits.hits[0]._source.domains && res.body.hits.hits[0]._source.domains.length === 1;
  }

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
      this.connectMongoose(this.mongoose, function(err) {
        if (err) {
          done(err);
        }

        self.helpers.elasticsearch.saveTestConfiguration(function(err) {
          if (err) {
            return done(err);
          }
          self.User = self.helpers.requireBackend('core/db/mongo/models/user');
          self.Domain = self.helpers.requireBackend('core/db/mongo/models/domain');
          done(err);
        });
      });
    });

    afterEach(function(done) {
      this.helpers.mongo.dropDatabase(done);
    });

    it('should return users which belong to the given domain when calling getUsersList', function(done) {
      var userFixtures = this.helpers.requireFixture('models/users.js')(this.User);
      var userDomain = this.helpers.requireBackend('core/user/domain');

      this.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        var userWithoutDomain = userFixtures.newDummyUser(['foo@bar.com']);
        userWithoutDomain.save(function(err) {
          if (err) { done(err); }

          userDomain.getUsersList([models.domain], undefined, function(err, users) {
            expect(err).to.not.exist;
            expect(users).to.exist;
            expect(users.list.length).to.equal(4);
            done();
          });
        });
      });
    });

    it('should return an array where limit === size when calling getUsersList with limit option', function(done) {
      var userDomain = this.helpers.requireBackend('core/user/domain');

      this.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        userDomain.getUsersList([models.domain], {limit: 2}, function(err, users) {
          expect(err).to.not.exist;
          expect(users).to.exist;
          expect(users.list.length).to.equal(2);
          done();
        });
      });
    });

    it('should return an array which contains the last 2 elements when calling getUsersList with offset option = 2 on domain members = 4', function(done) {
      var userDomain = this.helpers.requireBackend('core/user/domain');

      this.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        userDomain.getUsersList([models.domain], {offset: 2}, function(err, users) {
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
      var userDomain = this.helpers.requireBackend('core/user/domain');
      var self = this;

      this.helpers.api.applyDomainDeployment('linagora_test_domain', function(err, models) {
        if (err) { return done(err); }

        var ids = models.users.map(function(element) {
          return element._id;
        });

        self.helpers.elasticsearch.checkUsersDocumentsFullyIndexed(ids, checkIndexResult, function(err) {
          if (err) { return done(err); }

          userDomain.getUsersSearch([models.domain], {search: 'lng'}, function(err, users) {
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

    it('should return an error when calling getUsersList with a undefined domain', function(done) {
      var userDomain = this.helpers.requireBackend('core/user/domain');

      userDomain.getUsersList(undefined, undefined, function(err) {
        expect(err).to.exist;
        done();
      });
    });
  });

  describe('Tests cases (search users)', function() {
    var domain;

    var userDomain;

    var delphine;
    var philippe;

    before(function(done) {

      var self = this;
      this.mongoose = require('mongoose');
      this.connectMongoose(this.mongoose, function(err) {
        if (err) { done(err); }

        self.helpers.elasticsearch.saveTestConfiguration(function(err) {
          if (err) { return done(err); }

          self.helpers.api.applyDomainDeployment('linagora_test_cases', function(err, models) {
            if (err) { return done(err); }

            domain = models.domain;
            delphine = models.users[0];
            philippe = models.users[1];

            var ids = models.users.map(function(element) {
              return element._id;
            });
            self.helpers.elasticsearch.checkUsersDocumentsFullyIndexed(ids, checkIndexResult, function(err) {
              if (err) { return done(err); }
              self.mongoose.disconnect(done);
            });
          });
        });
      });
    });

    after(function(done) {
      this.helpers.mongo.dropDatabase(done);
    });

    beforeEach(function(done) {
      this.helpers.requireBackend('core/db/mongo/models/user');
      this.helpers.requireBackend('core/db/mongo/models/domain');
      userDomain = this.helpers.requireBackend('core/user/domain');

      this.mongoose = require('mongoose');
      this.connectMongoose(this.mongoose, done);
    });

    afterEach(function(done) {
      this.mongoose.disconnect(done);
    });

    it('should return only Delphine with request "Delp"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'Delp'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Philippe with request "faso"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'faso'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "yrel"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'yrel'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return nothing with request "deckard"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'deckard'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(0);
        done();
      });
    });

    it('should return nothing with request "Rachel Mifasol"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'Rachel Mifasol'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(0);
        done();
      });
    });

    it('should return nothing with request "Delphine interne.com"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'Delphine interne.com'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(0);
        done();
      });
    });

    it('should return Delphine and Philippe with request "phi"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'phi'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(2);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        expect(users.list[1]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return Delphine and Philippe with request "mi"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'mi'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(2);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        expect(users.list[1]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return Delphine and Philippe with request "linagora"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'linagora'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(2);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        expect(users.list[1]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "Delphine Doremi tyrell@linagora.fr"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'Delphine Doremi tyrell@linagora.fr'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "Delphine Delphine Doremi"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'Delphine Delphine Doremi'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "emi lin elp"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'emi lin elp'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "Rémi"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'Rémi'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return only Philippe with request "atty@li"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'atty@li'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(philippe._id.toString());
        done();
      });
    });

    it('should return only Delphine with request "DOREM"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'DOREM'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(delphine._id.toString());
        done();
      });
    });

    it('should return Delphine and Philippe with empty request', function(done) {

      userDomain.getUsersList([domain], undefined, function(err, users) {
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
    var domain;

    var userDomain;

    var user;

    before(function(done) {

      var self = this;
      this.mongoose = require('mongoose');
      this.connectMongoose(this.mongoose, function(err) {
        if (err) { done(err); }

        self.helpers.elasticsearch.saveTestConfiguration(function(err) {
          if (err) { return done(err); }

          userDomain = self.helpers.requireBackend('core/user/domain');

          self.helpers.api.applyDomainDeployment('linagora_test_cases_extra', function(err, models) {
            if (err) { return done(err); }

            domain = models.domain;
            user = models.users[0];

            self.helpers.elasticsearch.checkUsersDocumentsFullyIndexed([user._id], checkIndexResult, function(err) {
              if (err) { return done(err); }
              self.mongoose.disconnect(done);
            });
          });
        });
      });
    });

    after(function(done) {
      this.helpers.mongo.dropDatabase(done);
    });

    beforeEach(function(done) {
      this.mongoose = require('mongoose');
      this.connectMongoose(this.mongoose, done);
    });

    afterEach(function(done) {
      this.mongoose.disconnect(done);
    });

    it('should return the user with request "eeeeaaaaiic"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'eeeeaaaaiic'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(user._id.toString());
        done();
      });
    });

    it('should return the user with request "éèêëaàâäïîç"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'éèêëaàâäïîç'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(user._id.toString());
        done();
      });
    });

    it('should return the user with request "EEEEAAAAIIC"', function(done) {

      userDomain.getUsersSearch([domain], {search: 'EEEEAAAAIIC'}, function(err, users) {
        expect(err).to.not.exist;
        expect(users).to.exist;
        expect(users.list.length).to.equal(1);
        expect(users.list[0]._id).to.deep.equals(user._id.toString());
        done();
      });
    });

  });
});
