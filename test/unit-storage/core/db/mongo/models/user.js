'use strict';

var expect = require('chai').expect;
var mongodb = require('mongodb');

describe.skip('The User model', function() {
  var User, Domain, emails, email, email2, email_ci, email2_ci;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    User = this.mongoose.model('User');
    Domain = this.mongoose.model('Domain');
    emails = [];
    email = 'foo@linagora.com';
    email_ci = 'FOO@LiNaGoRa.com ';
    email2 = 'bar@linagora.com';
    email2_ci = '   bAR@linagora.com';
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  it('should save the user email in lowercase', function(done) {
    emails.push(email_ci);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});
    var mongoUrl = this.testEnv.mongoUrl;

    function test(savedUser) {
      mongodb.MongoClient.connect(mongoUrl, function(err, db) {
        if (err) { return done(err); }
        db.collection('users').findOne({_id: savedUser._id}, function(err, user) {
          if (err) { return done(err); }
          expect(user).to.be.not.null;
          expect(user.emails).to.be.an.array;
          expect(user.emails).to.have.length(1);
          expect(user.emails[0]).to.equal(email);
          db.close(done);
        });
      });
    }

    u.save(function(err, savedUser) {
      if (err) { return done(err); }
      test(savedUser);
    });
  });


  it('should load the user from email', function(done) {
    emails.push(email);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});
    u.save(function(err, data) {
      if (err) { return done(err); }
      User.loadFromEmail(email, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.exist;
        return done();
      });
    });
  });

  it('should load the user from email, case insensitive', function(done) {
    emails.push(email);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});
    u.save(function(err, data) {
      if (err) { return done(err); }
      User.loadFromEmail(email_ci, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.exist;
        return done();
      });
    });
  });

  it('should load user from any valid email', function(done) {
    emails.push(email);
    emails.push(email2);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }
      User.loadFromEmail(email, function(err, user) {
        expect(err).to.not.exist;
        expect(user).to.exist;
        done();
      });
    });
  });

  it('should not found any user with not registered email', function(done) {
    emails.push(email);
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }
      User.loadFromEmail('bar@linagora.com', function(err, user) {
        expect(user).to.not.exist;
        done();
      });
    });
  });

  it('should save the user with crypted password', function(done) {
    emails.push(email);
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails, password: password});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }
      expect(data.password).to.be.not.null;
      expect(data.password).to.be.not.equal(password);
      done();
    });
  });

  it('should return true when calling comparePassword with valid password', function(done) {
    emails.push(email);
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails, password: password});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }

      data.comparePassword(password, function(err, isMatch) {
        if (err) {
          done(err);
        }
        expect(isMatch).to.be.true;
        done();
      });
    });
  });

  it('should return error when calling comparePassword with null password', function(done) {
    emails.push(email);
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails, password: password});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }

      data.comparePassword(null, function(err, isMatch) {
        expect(err).to.exist;
        done();
      });
    });
  });

  it('should return false when calling comparePassword with wrong password', function(done) {
    emails.push(email);
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails, password: password});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }

      data.comparePassword('badpassword', function(err, isMatch) {
        if (err) {
          done(err);
        }
        expect(isMatch).to.be.false;
        done();
      });
    });
  });

  it('should return false when calling comparePassword with empty password (length === 0)', function(done) {
    emails.push(email);
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails, password: password});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }

      data.comparePassword('', function(err, isMatch) {
        expect(err).to.exist;
        done();
      });
    });
  });

  it('should add a login failure when calling loginFailure fn', function(done) {
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', password: password, emails: ['foo@bar.com']});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }

      u.loginFailure(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.login.failures).to.exist;
        expect(data.login.failures.length).to.equal(1);
        done();
      });
    });
  });

  it('should reset the login failure counter when calling resetLoginFailure fn', function(done) {
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', password: password, emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }

      u.resetLoginFailure(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.login.failures).to.exist;
        expect(data.login.failures.length).to.equal(0);
        done();
      });
    });
  });

  it('should set the login success date when calling loginSuccess fn', function(done) {
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', password: password, emails: ['foo@bar.com']});
    u.save(function(err, data) {
      if (err) {
        done(err);
      }

      u.loginSuccess(function(err, data) {
        expect(err).to.not.exist;
        expect(data).to.exist;
        expect(data.login.success).to.exist;
        done();
      });
    });
  });

  it('should add the domain when domain is not null', function(done) {
    var mongoUrl = this.testEnv.mongoUrl;
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', password: password, emails: ['foo@bar.com']});
    var d = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    u.save(function(err, user) {
      if (err) {
        return done(err);
      }

      d.save(function(err, domain) {
        if (err) {
          return done(err);
        }

        user.joinDomain(domain, function(err, update) {
          if (err) {
            return done(err);
          }

          mongodb.MongoClient.connect(mongoUrl, function(err, db) {
            if (err) { return done(err); }
            db.collection('users').findOne({_id: user._id}, function(err, loaded) {
              if (err) {
                return done(err);
              }

              expect(loaded).to.be.not.null;
              expect(loaded.domains).to.be.not.null;
              expect(loaded.domains.length).to.equal(1);
              expect(loaded.domains[0].domain_id.equals(domain._id)).to.be.true;
              db.close(done);
            });
          });
        });
      });
    });
  });

  it('should not add null domain', function(done) {
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', password: password, emails: ['foo@bar.com']});
    u.save(function(err, user) {
      if (err) {
        return done(err);
      }

      user.joinDomain(null, function(err, update) {
        expect(err).to.exist;
        done();
      });
    });
  });

  it('should add domain from its ID', function(done) {
    var mongoUrl = this.testEnv.mongoUrl;
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', password: password, emails: ['foo@bar.com']});
    var d = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    u.save(function(err, user) {
      if (err) {
        return done(err);
      }

      d.save(function(err, domain) {
        if (err) {
          return done(err);
        }

        user.joinDomain(domain._id, function(err, update) {
          if (err) {
            return done(err);
          }

          mongodb.MongoClient.connect(mongoUrl, function(err, db) {
            if (err) { return done(err); }
            db.collection('users').findOne({_id: user._id}, function(err, loaded) {
              if (err) {
                return done(err);
              }

              expect(loaded).to.be.not.null;
              expect(loaded.domains).to.be.not.null;
              expect(loaded.domains.length).to.equal(1);
              expect(loaded.domains[0].domain_id.equals(domain._id)).to.be.true;
              db.close(done);
            });
          });
        });
      });
    });
  });

  it('should not add the domain to the user if the domain is already in the domain list', function(done) {
    var mongoUrl = this.testEnv.mongoUrl;
    var password = 'secret';
    var u = new User({ firstname: 'foo', lastname: 'bar', password: password, emails: ['foo@bar.com']});
    var d = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    d.save(function(err, domain) {
      u.domains.push({domain_id: domain._id});
      u.save(function(err, user) {
        if (err) {
          return done(err);
        }

        user.joinDomain(domain._id, function(err, update) {
          expect(err).to.exist;

          mongodb.MongoClient.connect(mongoUrl, function(err, db) {
            if (err) { return done(err); }
            db.collection('users').findOne({_id: user._id}, function(err, loaded) {
              if (err) {
                return done(err);
              }
              expect(loaded).to.be.not.null;
              expect(loaded.domains).to.be.not.null;
              expect(loaded.domains.length).to.equal(1);
              expect(loaded.domains[0].domain_id.equals(domain._id)).to.be.true;
              db.close(done);
            });
          });
        });
      });
    });
  });

  it('should return error when calling isMemberOfDomain with null domain', function(done) {
    var u = new User({ firstname: 'foo', lastname: 'bar', emails: ['foo@bar.com']});
    u.save(function(err, user) {
      if (err) {
        done(err);
      }
      try {
        user.isMemberOfDomain(null);
        done(new Error('An error should have been thrown'));
      }
      catch (err) {
        expect(err).to.exist;
        done();
      }
    });
  });

  it('should return false when calling isMemberOfDomain with wrong domain id', function(done) {
    var d = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});
    d.save(function(err, domain) {
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: ['foo@bar.com']});
      u.save(function(err, user) {
        if (err) {
          done(err);
        }

        var isMember = user.isMemberOfDomain('wrongDomainId');
        expect(isMember).to.be.false;
        done();
      });
    });
  });

  it('should return true when calling isMemberOfDomain with correct domain id', function(done) {
    var mongoUrl = this.testEnv.mongoUrl;
    var d = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    d.save(function(err, domain) {
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: ['foo@bar.com']});
      u.save(function(err, user) {
        if (err) {
          done(err);
        }

        user.joinDomain(domain._id, function(err, update) {
          if (err) {
            return done(err);
          }

          mongodb.MongoClient.connect(mongoUrl, function(err, db) {
            if (err) {
              return done(err);
            }
            db.collection('users').findOne({_id: user._id}, function(err, loaded) {
              if (err) {
                return done(err);
              }

              var loadedUser = new User(loaded);
              var isMember = loadedUser.isMemberOfDomain(domain);
              expect(isMember).to.be.true;

              isMember = loadedUser.isMemberOfDomain(domain._id);
              expect(isMember).to.be.true;
              db.close(done);
            });
          });
        });

      });
    });
  });


  afterEach(function(done) {
    emails = [];

    var callback = function(item, fn) {
      item.remove(fn);
    };

    var async = require('async');
    async.parallel([
      function(cb) {
        User.find().exec(function(err, users) {
          async.forEach(users, callback, cb);
        });
      }
    ], function() {
      this.mongoose.disconnect(done);
    }.bind(this));
  });
});
