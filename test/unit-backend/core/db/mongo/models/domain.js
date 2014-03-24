'use strict';

var expect = require('chai').expect;
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

  describe('members field', function() {
    it('should be filled on domain save', function(done) {
      var user = new User({firstname: 'foo', lastname: 'foo', emails: ['foo@linagora.com']});
      user.save(function(err, u) {
        expect(err).to.not.exist;
        expect(u._id).to.exist;

        var dom = {
          name: 'the domain',
          company_name: 'addMembersCompany001',
          members: [u._id]
        };

        var domain = new Domain(dom);
        domain.save(function(err, result) {
          expect(err).to.not.exist;
          expect(result._id).to.exist;
          expect(result.members).to.exist;
          expect(result.members.length).to.equal(1);
          expect(result.members[0]).to.equal(u._id);
          done();
        });
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

  describe('The addMember Function', function() {

    it('Should fail when user is null', function(done) {
      var dom = {
        name: 'the domain',
        company_name: 'addMemberCompany000'
      };

      var domain = new Domain(dom);
      domain.save(function(err, result) {
        expect(err).to.not.exist;
        expect(result._id).to.exist;
        domain.addMember(null, function(err, data) {
          expect(err).to.exist;
          done();
        });
      });
    });

    it('Should add a member to the domain when domain list is null or empty', function(done) {
      var user = new User({firstname: 'foo', lastname: 'bar', emails: emails});
      var mongoUrl = this.testEnv.mongoUrl;
      var dom = {
        name: 'the domain',
        company_name: 'addMemberCompany001'
      };

      user.save(function(err, u) {
        expect(err).to.not.exist;
        expect(u._id).to.exist;

        var domain = new Domain(dom);
        domain.save(function(err, result) {
          expect(err).to.not.exist;
          expect(result._id).to.exist;
          domain.addMember(u, function(err, data) {
            expect(err).to.not.exist;
            expect(data).to.exist;
            expect(data).to.equal(1);

            mongodb.MongoClient.connect(mongoUrl, function(err, db) {
              if (err) { return done(err); }
              db.collection('domains').findOne({_id: result._id}, function(err, domain) {
                if (err) {
                  return done(err);
                }
                expect(domain).to.be.not.null;
                expect(domain.members).to.be.not.null;
                expect(domain.members.length).to.equal(1);
                expect(domain.members[0]).to.deep.equal(u._id);
                db.close(done);
              });
            });
          });
        });
      });
    });

    it('Should not add a member to the domain when user is already in list', function(done) {
      var user = new User({firstname: 'foo', lastname: 'bar', emails: emails});
      var mongoUrl = this.testEnv.mongoUrl;
      var dom = {
        name: 'the domain',
        company_name: 'addMemberCompany002'
      };

      user.save(function(err, u) {
        expect(err).to.not.exist;
        expect(u._id).to.exist;

        var domain = new Domain(dom);
        domain.save(function(err, result) {
          expect(err).to.not.exist;
          expect(result._id).to.exist;
          domain.addMember(u, function(err, data) {
            expect(err).to.not.exist;
            expect(data).to.exist;

            domain.addMember(u, function(err, data) {
              expect(err).to.not.exist;

              mongodb.MongoClient.connect(mongoUrl, function(err, db) {
                if (err) { return done(err); }
                db.collection('domains').findOne({_id: result._id}, function(err, domain) {
                  if (err) {
                    return done(err);
                  }
                  expect(domain).to.be.not.null;
                  expect(domain.members).to.be.not.null;
                  expect(domain.members.length).to.equal(1);
                  db.close(done);
                });
              });
            });
          });
        });
      });
    });
  });

  describe('The addMembers Function', function() {

    it('Should fail when users is null', function(done) {
      var dom = {
        name: 'the domain',
        company_name: 'addMembersCompany000'
      };

      var domain = new Domain(dom);
      domain.save(function(err, result) {
        expect(err).to.not.exist;
        expect(result._id).to.exist;
        domain.addMembers(null, function(err, data) {
          expect(err).to.exist;
          done();
        });
      });
    });

    it('Should add members to the domain when users are not in the members list', function(done) {

      var fooUser = new User({firstname: 'foo', lastname: 'foo', emails: ['foo@linagora.com']});
      var barUser = new User({firstname: 'bar', lastname: 'bar', emails: ['bar@linagora.com']});
      var mongoUrl = this.testEnv.mongoUrl;

      fooUser.save(function(err, foo) {
        expect(err).to.not.exist;
        expect(foo).to.exist;

        barUser.save(function(err, bar) {
          expect(err).to.not.exist;
          expect(bar).to.exist;

          var dom = {
            name: 'the domain',
            company_name: 'addMembersCompany001',
            members: [foo._id]
          };

          var domain = new Domain(dom);
          domain.save(function(err, result) {
            expect(err).to.not.exist;
            expect(result._id).to.exist;

            domain.addMembers([foo, bar], function(err, data) {
              expect(err).to.not.exist;
              expect(data).to.exist;
              expect(data).to.equal(1);

              mongodb.MongoClient.connect(mongoUrl, function(err, db) {
                if (err) { return done(err); }
                db.collection('domains').findOne({_id: result._id}, function(err, domain) {
                  if (err) {
                    return done(err);
                  }
                  expect(domain).to.be.not.null;
                  expect(domain.members).to.be.not.null;
                  expect(domain.members.length).to.equal(2);
                  db.close(done);
                });
              });
            });
          });
        });
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
