'use strict';

var expect = require('chai').expect;

describe.skip('The user domain module', function() {

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    this.mongoose = require('mongoose');
    this.mongoose.connect(this.testEnv.mongoUrl, done);
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  it('should return users which belong the the given domain when calling getUsers', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');

    var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

    var foouser = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ password: 'secret', emails: ['bar@bar.com'], login: { failures: [new Date()]}});
    var bazuser = new User({ password: 'secret', emails: ['baz@bar.com'], login: { failures: [new Date()]}});
    var domain = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    function saveUser(user, domain, cb) {
      if (domain) {
        user.domains.push({domain_id: domain._id});
      }
      user.save(function(err, saved) {
        return cb(err, saved);
      });
    }

    domain.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, saved, callback);
        },
        function(callback) {
          saveUser(baruser, saved, callback);
        },
        function(callback) {
          saveUser(bazuser, null, callback);
        }
      ],
      function(err) {
        if (err) {
          return done(err);
        }
        userDomain.getUsers(saved, null, function(err, users) {
          expect(err).to.not.exist;
          expect(users).to.exist;
          expect(users.list.length).to.equal(2);
          done();
        });
      });
    });
  });

  it('should return an array where limit === size when calling getUsers with limit option', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');

    var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

    var foouser = new User({ password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ password: 'secret', emails: ['bar@bar.com'], login: { failures: [new Date()]}});
    var bazuser = new User({ password: 'secret', emails: ['baz@bar.com'], login: { failures: [new Date()]}});
    var domain = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    function saveUser(user, domain, cb) {
      if (domain) {
        user.domains.push({domain_id: domain._id});
      }
      user.save(function(err, saved) {
        return cb(err, saved);
      });
    }

    domain.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, saved, callback);
        },
        function(callback) {
          saveUser(baruser, saved, callback);
        },
        function(callback) {
          saveUser(bazuser, saved, callback);
        }
      ],
        function(err) {
          if (err) {
            return done(err);
          }
          userDomain.getUsers(saved, {limit: 2}, function(err, users) {
            expect(err).to.not.exist;
            expect(users).to.exist;
            expect(users.list.length).to.equal(2);
            done();
          });
        });
    });
  });

  it('should return an array which contains the last 2 elements when calling getUsers with offset option = 2 on domain members = 4', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');

    var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

    var foouser = new User({ firstname: 'a', password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ firstname: 'b', password: 'secret', emails: ['bar@bar.com'], login: { failures: [new Date()]}});
    var bazuser = new User({ firstname: 'c', password: 'secret', emails: ['baz@bar.com'], login: { failures: [new Date()]}});
    var quxuser = new User({ firstname: 'd', password: 'secret', emails: ['qux@bar.com'], login: { failures: [new Date()]}});
    var domain = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    function saveUser(user, domain, cb) {
      if (domain) {
        user.domains.push({domain_id: domain._id});
      }
      user.save(function(err, saved) {
        return cb(err, saved);
      });
    }

    domain.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, saved, callback);
        },
        function(callback) {
          saveUser(baruser, saved, callback);
        },
        function(callback) {
          saveUser(bazuser, saved, callback);
        },
        function(callback) {
          saveUser(quxuser, saved, callback);
        }
      ],
      function(err) {
        if (err) {
          return done(err);
        }
        userDomain.getUsers(saved, {offset: 2}, function(err, users) {
          expect(err).to.not.exist;
          expect(users).to.exist;
          expect(users.list.length).to.equal(2);

          expect(users.list[0]._id).to.deep.equals(bazuser._id);
          expect(users.list[1]._id).to.deep.equals(quxuser._id);
          done();
        });
      });
    });
  });

  it('should return the users which belong to a domain and which contain the search term', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');

    var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

    var foouser = new User({ firstname: 'foo', password: 'secret', emails: ['foo@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ firstname: 'b', lastname: 'oofoo', password: 'secret', emails: ['bar@bar.com'], login: { failures: [new Date()]}});
    var bazuser = new User({ firstname: 'c', password: 'secret', emails: ['fooo@bar.com'], login: { failures: [new Date()]}});
    var quxuser = new User({ firstname: 'd', password: 'secret', emails: ['qux@bar.com'], login: { failures: [new Date()]}});
    var domain = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    function saveUser(user, domain, cb) {
      if (domain) {
        user.domains.push({domain_id: domain._id});
      }
      user.save(function(err, saved) {
        return cb(err, saved);
      });
    }

    domain.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, saved, callback);
        },
        function(callback) {
          saveUser(baruser, saved, callback);
        },
        function(callback) {
          saveUser(bazuser, saved, callback);
        },
        function(callback) {
          saveUser(quxuser, saved, callback);
        }
      ],
        function(err) {
          if (err) {
            return done(err);
          }
          userDomain.getUsers(saved, {search: 'foo'}, function(err, users) {
            expect(err).to.not.exist;
            expect(users).to.exist;
            expect(users.list.length).to.equal(3);
            expect(users.list[0]._id).to.deep.equals(baruser._id);
            expect(users.list[1]._id).to.deep.equals(bazuser._id);
            expect(users.list[2]._id).to.deep.equals(foouser._id);
            done();
          });
        });
    });
  });

  it('should return the users which belong to a domain and which contain the search terms as space separated string', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');

    var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

    var foouser = new User({ firstname: 'foobarbaz', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ firstname: 'b', lastname: 'oofoo', password: 'secret', emails: ['bar@bar.com'], login: { failures: [new Date()]}});
    var bazuser = new User({ firstname: 'c', password: 'secret', emails: ['oooofooo@bar.com'], login: { failures: [new Date()]}});
    var quxuser = new User({ firstname: 'd', password: 'secret', emails: ['qux@bar.com'], login: { failures: [new Date()]}});
    var domain = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    function saveUser(user, domain, cb) {
      if (domain) {
        user.domains.push({domain_id: domain._id});
      }
      user.save(function(err, saved) {
        return cb(err, saved);
      });
    }

    domain.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, saved, callback);
        },
        function(callback) {
          saveUser(baruser, saved, callback);
        },
        function(callback) {
          saveUser(bazuser, saved, callback);
        },
        function(callback) {
          saveUser(quxuser, saved, callback);
        }
      ],
        function(err) {
          if (err) {
            return done(err);
          }
          userDomain.getUsers(saved, {search: 'foo bar'}, function(err, users) {
            expect(err).to.not.exist;
            expect(users).to.exist;
            expect(users.list.length).to.equal(2);
            expect(users.list[0]._id).to.deep.equals(bazuser._id);
            expect(users.list[1]._id).to.deep.equals(foouser._id);
            done();
          });
        });
    });
  });

  it('should return the users which belong to a domain and which contain the search terms as array', function(done) {
    var User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    var Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');

    var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

    var foouser = new User({ firstname: 'foobarbaz', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ firstname: 'b', lastname: 'oofoo', password: 'secret', emails: ['bar@bar.com'], login: { failures: [new Date()]}});
    var bazuser = new User({ firstname: 'c', password: 'secret', emails: ['oooofooo@bar.com'], login: { failures: [new Date()]}});
    var quxuser = new User({ firstname: 'd', password: 'secret', emails: ['qux@bar.com'], login: { failures: [new Date()]}});
    var domain = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});

    function saveUser(user, domain, cb) {
      if (domain) {
        user.domains.push({domain_id: domain._id});
      }
      user.save(function(err, saved) {
        return cb(err, saved);
      });
    }

    domain.save(function(err, saved) {
      if (err) {
        return done(err);
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, saved, callback);
        },
        function(callback) {
          saveUser(baruser, saved, callback);
        },
        function(callback) {
          saveUser(bazuser, saved, callback);
        },
        function(callback) {
          saveUser(quxuser, saved, callback);
        }
      ],
        function(err) {
          if (err) {
            return done(err);
          }
          userDomain.getUsers(saved, {search: ['foo', 'bar']}, function(err, users) {
            expect(err).to.not.exist;
            expect(users).to.exist;
            expect(users.list.length).to.equal(2);
            expect(users.list[0]._id).to.deep.equals(bazuser._id);
            expect(users.list[1]._id).to.deep.equals(foouser._id);
            done();
          });
        });
    });
  });

  it('should return an error when calling getUsers with a null domain', function(done) {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    var userDomain = require(this.testEnv.basePath + '/backend/core/user/domain');

    userDomain.getUsers(null, null, function(err, users) {
      expect(err).to.exist;
      done();
    });
  });
});

