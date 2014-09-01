'use strict';

var chai = require('chai');
chai.use(require('chai-datetime'));
var expect = chai.expect;
var mongodb = require('mongodb');

describe('The domain model module', function() {
  var Domain, User, emails;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    this.testEnv.writeDBConfigFile();
    Domain = this.mongoose.model('Domain');
    User = this.mongoose.model('User');
    emails = ['foo@linagora.com', 'bar@linagora.com'];

    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.testEnv.removeDBConfigFile();
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('name field', function() {
    it('should be recorded in lowercase, without spaces', function(done) {
      var initialName = '  ThE DoMaIn  ';
      var finalName = 'the domain';
      var mongoUrl = this.testEnv.mongoUrl;
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      function saveUser(callback) {
        u.save(function(err, savedUser) {
          if (err) { return done(err); }
          return callback(savedUser);
        });
      }

      function saveDomain(domainJSON, callback) {
        var domain = new Domain(domainJSON);
        domain.save(function(err, savedDomain) {
          if (err) { return done(err); }
          return callback(savedDomain);
        });
      }

      function test(savedDomain) {
        mongodb.MongoClient.connect(mongoUrl, function(err, db) {
          if (err) { return done(err); }
          db.collection('domains').findOne({_id: savedDomain._id}, function(err, domain) {
            if (err) { return done(err); }
            expect(domain).to.be.not.null;
            expect(domain.name).to.equal(finalName);
            db.close(done);
          });
        });
      }

      saveUser(function(savedUser) {
        var dom = {
          name: initialName,
          company_name: 'Foo Corporate',
          administrator: savedUser
        };

        saveDomain(dom, test);
      });

    });
  });

  describe('company field', function() {
    it('should be recorded in lowercase, without spaces', function(done) {
      var initialName = '  ThE CoMpAnY  ';
      var finalName = 'the company';
      var mongoUrl = this.testEnv.mongoUrl;
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      function saveUser(callback) {
        u.save(function(err, savedUser) {
          if (err) { return done(err); }
          return callback(savedUser);
        });
      }

      function saveDomain(domainJSON, callback) {
        var domain = new Domain(domainJSON);
        domain.save(function(err, savedDomain) {
          if (err) { return done(err); }
          return callback(savedDomain);
        });
      }

      function test(savedDomain) {
        mongodb.MongoClient.connect(mongoUrl, function(err, db) {
          if (err) { return done(err); }
          db.collection('domains').findOne({_id: savedDomain._id}, function(err, domain) {
            if (err) { return done(err); }
            expect(domain).to.be.not.null;
            expect(domain.company_name).to.equal(finalName);
            db.close(done);
          });
        });
      }

      saveUser(function(savedUser) {
        var dom = {
          name: 'the domain',
          company_name: initialName,
          administrator: savedUser
        };

        saveDomain(dom, test);
      });

    });
  });

  describe('testCompany static method', function() {

    it('should return an domain object where company=company_name', function(done) {
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      u.save(function(err, savedUser) {
        if (err) {
          done(err);
        }

        var dom = {
          name: 'Marketing',
          company_name: 'Foo Corporate',
          administrator: savedUser
        };

        var i = new Domain(dom);
        i.save(function(err, data) {
          if (err) {
            done(err);
          }

          Domain.testCompany(data.company_name, function(err, domain) {
            expect(err).to.not.exist;
            expect(domain).to.exist;
            done();
          });
        });
      });
    });

    it('should return an domain object where company=company_name case insensitive', function(done) {
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      u.save(function(err, savedUser) {
        if (err) { return done(err); }

        var dom = {
          name: 'Marketing',
          company_name: 'Foo Corporate',
          administrator: savedUser
        };

        var i = new Domain(dom);
        i.save(function(err, data) {
          if (err) { return done(err); }

          Domain.testCompany('FOO CORPORATE', function(err, domain) {
            expect(err).to.not.exist;
            expect(domain).to.exist;
            done();
          });
        });
      });
    });

    it('should return an error when domain object (domain.company_name=company_name) does not exist', function(done) {
      Domain.testCompany('TotoCorporate', function(err, domain) {
        expect(err).to.not.exist;
        expect(domain).to.be.null;
        done();
      });
    });
  });

  describe('testDomainCompany static method', function() {

    it('should return an domain object where domain.company_name=company_name and domain.name=domain_name', function(done) {
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      u.save(function(err, savedUser) {
        if (err) {
          return done(err);
        }

        var dom = {
          name: 'Marketing',
          company_name: 'Foo Corporate',
          administrator: savedUser
        };

        var i = new Domain(dom);
        i.save(function(err, data) {
          if (err) {
            return done(err);
          }

          Domain.testDomainCompany(data.company_name, data.name, function(err, domain) {
            expect(err).to.not.exist;
            expect(domain).to.exist;
            done();
          });
        });
      });
    });

    it('should return an domain object where domain.company_name=company_name and domain.name=domain_name, case insensitive', function(done) {
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      u.save(function(err, savedUser) {
        if (err) { return done(err); }

        var dom = {
          name: 'Marketing',
          company_name: 'Foo Corporate',
          administrator: savedUser
        };

        var i = new Domain(dom);
        i.save(function(err, data) {
          if (err) { return done(err); }

          Domain.testDomainCompany(' FOO CoRPOraTE ', '  MARKETING  ', function(err, domain) {
            expect(err).to.not.exist;
            expect(domain).to.exist;
            done();
          });
        });
      });
    });

    it('should return an error when domain object (domain.company_name=company_name and domain.name=domain_name) does not exist', function(done) {
      Domain.testDomainCompany('Corpo', 'Toto', function(err, domain) {
        expect(err).to.not.exist;
        expect(domain).to.be.null;
        done();
      });
    });
  });

  describe('The loadFromID static method', function() {

    it('should return a valid domain', function(done) {
      var domain = new Domain({
        name: 'the domain',
        company_name: 'loadFromID001'
      });

      domain.save(function(err, d) {
        expect(err).to.not.exist;

        Domain.loadFromID(d._id, function(err, result) {
          expect(err).to.not.exist;
          expect(result._id).to.deep.equal(d._id);
          done();
        });
      });
    });

    it('should return error on null ID', function(done) {
      Domain.loadFromID(null, function(err, result) {
        expect(err).to.exist;
        expect(result).to.not.exist;
        done();
      });
    });
  });
});
