'use strict';

var expect = require('chai').expect;

describe.only('The User model', function() {
  var User, Domain, email, email2, email_ci, email2_ci, helpers, userFixtures, domainFixtures;

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    helpers = this.helpers;
    helpers.requireBackend('core/db/mongo/models/user');
    helpers.requireBackend('core/db/mongo/models/domain');
    User = this.mongoose.model('User');
    Domain = this.mongoose.model('Domain');
    userFixtures = helpers.requireFixture('models/users.js')(User);
    domainFixtures = helpers.requireFixture('models/domains.js')(Domain);
    email = 'foo@linagora.com';
    email_ci = 'FOO@LiNaGoRa.com ';
    email2 = 'bar@linagora.com';
    email2_ci = '   bAR@linagora.com';
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  it('should save the user email trimmed and in lowercase', function(done) {
    userFixtures.newDummyUser([email_ci]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        expect(user.emails).to.deep.equal([email]);

        done();
      }));
    }));
  });

  it('should load the user from email', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function() {
        User.loadFromEmail(email, helpers.callbacks.noErrorAndData(done));
      }));
  });

  it('should load the user from email, case insensitive', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function() {
        User.loadFromEmail(email_ci, helpers.callbacks.noErrorAndData(done));
      }));
  });

  it('should load user from any valid email', function(done) {
    userFixtures.newDummyUser([email, email2]).save(helpers.callbacks.noErrorAnd(function() {
        User.loadFromEmail(email, helpers.callbacks.noErrorAndData(done));
      }));
  });

  it('should load user from any valid email, even with multiple accounts', function(done) {
    var user = userFixtures.newDummyUser([email, email2]);

    user.accounts.push({
      type: 'email',
      emails: ['foo@bar.com']
    });
    user.save(helpers.callbacks.noErrorAnd(function() {
      User.loadFromEmail('foo@bar.com', helpers.callbacks.noErrorAndData(done));
    }));
  });

  it('should not found any user with not registered email', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function() {
      User.loadFromEmail('bar@linagora.com', helpers.callbacks.noErrorAndNoData(done));
    }));
  });

  it('should save the user with crypted password', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        expect(user.password).to.not.equal(null);
        expect(user.password).to.not.equal(userFixtures.password);

        done();
      }));
    }));
  });

  it('should return true when calling comparePassword with valid password', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        user.comparePassword(userFixtures.password, helpers.callbacks.noErrorAnd(function(isMatch) {
          expect(isMatch).to.equal(true);

          done();
        }));
      }));
    }));
  });

  it('should return error when calling comparePassword with null password', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        user.comparePassword(null, helpers.callbacks.error(done));
      }));
    }));
  });

  it('should return false when calling comparePassword with wrong password', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        user.comparePassword('badpassword', helpers.callbacks.noErrorAnd(function(isMatch) {
          expect(isMatch).to.equal(false);

          done();
        }));
      }));
    }));
  });

  it('should return false when calling comparePassword with empty password (length === 0)', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        user.comparePassword('', helpers.callbacks.error(done));
      }));
    }));
  });

  it('should add a login failure when calling loginFailure fn', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        user.loginFailure(helpers.callbacks.noErrorAnd(function(data) {
          expect(data.login.failures.length).to.equal(1);

          done();
        }));
      }));
    }));
  });

  it('should reset the login failure counter when calling resetLoginFailure fn', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        user.resetLoginFailure(helpers.callbacks.noErrorAnd(function(data) {
          expect(data.login.failures.length).to.equal(0);

          done();
        }));
      }));
    }));
  });

  it('should set the login success date when calling loginSuccess fn', function(done) {
    userFixtures.newDummyUser([email]).save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        user.loginSuccess(helpers.callbacks.noErrorAnd(function(data) {
          expect(data.login.success).to.be.an.instanceOf(Date);

          done();
        }));
      }));
    }));
  });

  it('should add the domain when domain is not null', function(done) {
    userFixtures.newDummyUser(['foo@bar.com']).save(helpers.callbacks.noErrorAnd(function(user) {
      domainFixtures.newDummyDomain().save(helpers.callbacks.noErrorAnd(function(domain) {
        user.joinDomain(domain, helpers.callbacks.noErrorAnd(function() {
          User.findOne({ _id: user._id }, helpers.callbacks.noErrorAnd(function(loaded) {
            expect(loaded.domains[0].domain_id).to.deep.equal(domain._id);

            done();
          }));
        }));
      }));
    }));
  });

  it('should not add null domain', function(done) {
    userFixtures.newDummyUser(['foo@bar.com']).save(helpers.callbacks.noErrorAnd(function(user) {
      user.joinDomain(null, helpers.callbacks.error(done));
    }));
  });

  it('should add domain from its ID', function(done) {
    userFixtures.newDummyUser(['foo@bar.com']).save(helpers.callbacks.noErrorAnd(function(user) {
      domainFixtures.newDummyDomain().save(helpers.callbacks.noErrorAnd(function(domain) {
        user.joinDomain(domain._id, helpers.callbacks.noErrorAnd(function() {
          User.findOne({ _id: user._id }, helpers.callbacks.noErrorAnd(function(loaded) {
            expect(loaded.domains[0].domain_id).to.deep.equal(domain._id);

            done();
          }));
        }));
      }));
    }));
  });

  it('should not add the domain to the user if the domain is already in the domain list', function(done) {
    var u = userFixtures.newDummyUser(['foo@bar.com']);

    domainFixtures.newDummyDomain().save(helpers.callbacks.noErrorAnd(function(domain) {
      u.domains.push({ domain_id: domain._id });

      u.save(helpers.callbacks.noErrorAnd(function(user) {
        user.joinDomain(domain._id, helpers.callbacks.error(done));
      }));
    }));
  });

  it('should return error when calling isMemberOfDomain with null domain', function(done) {
    userFixtures.newDummyUser(['foo@bar.com']).save(helpers.callbacks.noErrorAnd(function(user) {
      expect(function() { user.isMemberOfDomain(null); }).to.throw(Error);

      done();
    }));
  });

  it('should return false when calling isMemberOfDomain with wrong domain id', function(done) {
    domainFixtures.newDummyDomain().save(helpers.callbacks.noErrorAnd(function(domain) {
      userFixtures.newDummyUser(['foo@bar.com']).save(helpers.callbacks.noErrorAnd(function(user) {
        expect(user.isMemberOfDomain('wrongDomainId')).to.equal(false);

        done();
      }));
    }));
  });

  it('should return true when calling isMemberOfDomain with correct domain id', function(done) {
    userFixtures.newDummyUser(['foo@bar.com']).save(helpers.callbacks.noErrorAnd(function(user) {
      domainFixtures.newDummyDomain().save(helpers.callbacks.noErrorAnd(function(domain) {
        user.joinDomain(domain._id, helpers.callbacks.noErrorAnd(function() {
          User.findOne({ _id: user._id }, helpers.callbacks.noErrorAnd(function(loaded) {
            expect(loaded.isMemberOfDomain(domain._id)).to.equal(true);

            done();
          }));
        }));
      }));
    }));
  });

  it('should return true when calling isMemberOfDomain with correct domain', function(done) {
    userFixtures.newDummyUser(['foo@bar.com']).save(helpers.callbacks.noErrorAnd(function(user) {
      domainFixtures.newDummyDomain().save(helpers.callbacks.noErrorAnd(function(domain) {
        user.joinDomain(domain._id, helpers.callbacks.noErrorAnd(function() {
          User.findOne({ _id: user._id }, helpers.callbacks.noErrorAnd(function(loaded) {
            expect(loaded.isMemberOfDomain(domain)).to.equal(true);

            done();
          }));
        }));
      }));
    }));
  });

  it('should register the emails property on User model, computing the list of all emails', function(done) {
    var u = userFixtures.newDummyUser([email, email2]);

    u.accounts.push({
      type: 'email',
      emails: ['foo@bar.com']
    });
    u.save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        expect(user.emails).to.deep.equal([email, email2, 'foo@bar.com']);

        done();
      }));
    }));
  });

  it('should validate that preferredEmailIndex is >= 0', function(done) {
    var u = userFixtures.newDummyUser([email, email2]);

    u.accounts.push({
      type: 'email',
      emails: ['foo@bar.com'],
      preferredEmailIndex: -1
    });
    u.save(helpers.callbacks.error(done));
  });

  it('should not fail when emails array is empty', function(done) {
    var u = userFixtures.newDummyUser([email, email2]);

    u.accounts.push({
      type: 'email',
      emails: [],
      preferredEmailIndex: 3
    });
    u.save(helpers.callbacks.noError(done));
  });

  it('should not fail when emails array is undefined', function(done) {
    var u = userFixtures.newDummyUser([email, email2]);

    u.accounts.push({
      type: 'email',
      preferredEmailIndex: 1
    });
    u.save(helpers.callbacks.noError(done));
  });

  it('should be able to add oauth account data', function(done) {
    var u = userFixtures.newDummyUser([email, email2]);

    u.accounts.push({
      type: 'oauth',
      data: {
        provider: 'twitter'
      }
    });
    u.save(helpers.callbacks.noError(done));
  });

  it('should validate that preferredEmailIndex is < emails.length', function(done) {
    var u = userFixtures.newDummyUser([email, email2]);

    u.accounts.push({
      type: 'email',
      emails: ['foo@bar.com'],
      preferredEmailIndex: 2
    });
    u.save(helpers.callbacks.error(done));
  });

  it('should set preferredEmail to null when user has no accounts', function(done) {
    var user = userFixtures.newDummyUser();

    user.accounts = [];
    user.save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        expect(user.preferredEmail).to.equal(null);

        done();
      }));
    }));
  });

  it('should set preferredEmail to the preferred email of the first hosted email account', function(done) {
    var user = userFixtures.newDummyUser([email, email2], 'secret', 1);

    user.save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        expect(user.preferredEmail).to.equal(email2);

        done();
      }));
    }));
  });

  it('should set preferredEmail to the preferred email of the first hosted email account when there is multiple hosted accounts', function(done) {
    var user = userFixtures.newDummyUser();

    user.accounts.unshift({
      type: 'email',
      hosted: true,
      emails: ['another@email.com']
    });
    user.accounts.push({
      type: 'email',
      hosted: true,
      emails: ['another-one@email.com']
    });
    user.save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        expect(user.preferredEmail).to.equal('another@email.com');

        done();
      }));
    }));
  });

  it('should set preferredEmail to the preferred email of the first hosted email account when there is other accounts', function(done) {
    var user = userFixtures.newDummyUser();

    user.accounts.unshift({
      type: 'email',
      hosted: false,
      emails: ['external@email.com']
    });
    user.accounts.push({
      type: 'email',
      hosted: false,
      emails: ['another-external@email.com']
    });
    user.save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        expect(user.preferredEmail).to.equal(email);

        done();
      }));
    }));
  });

  it('should set preferredEmail to the preferred email of the first email account when there is no hosted account', function(done) {
    var user = userFixtures.newDummyUser();

    user.accounts = [{
      type: 'email',
      hosted: false,
      emails: ['another-external@email.com', 'yet-another-one@mail.com'],
      preferredEmailIndex: 1
    }, {
      type: 'email',
      hosted: false,
      emails: ['external@email.com']
    }];
    user.save(helpers.callbacks.noErrorAnd(function(savedUser) {
      User.findOne({ _id: savedUser._id }, helpers.callbacks.noErrorAnd(function(user) {
        expect(user.preferredEmail).to.equal('yet-another-one@mail.com');

        done();
      }));
    }));
  });

  afterEach(function(done) {
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
