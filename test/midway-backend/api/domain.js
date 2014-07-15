'use strict';

var request = require('supertest'),
    expect = require('chai').expect;


describe('The domain API', function() {
  var app;
  var foouser, baruser, bazuser;
  var domain;
  var password = 'secret';
  var Domain;
  var User;

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      app = require(self.testEnv.basePath + '/backend/webserver/application');
      self.mongoose = require('mongoose');
      User = require(self.testEnv.basePath + '/backend/core/db/mongo/models/user');
      Domain = require(self.testEnv.basePath + '/backend/core/db/mongo/models/domain');

      foouser = new User({
        username: 'Foo',
        password: password,
        emails: ['foo@bar.com']
      });

      baruser = new User({
        username: 'Bar',
        password: password,
        emails: ['bar@bar.com']
      });

      bazuser = new User({
        username: 'Baz',
        password: password,
        emails: ['baz@bar.com'],
        domains: []
      });

      domain = new Domain({
        name: 'MyDomain',
        company_name: 'MyAwesomeCompany'
      });

      function saveUser(user, cb) {
        user.save(function(err, saved) {
          if (saved) {
            user._id = saved._id;
          }
          return cb(err, saved);
        });
      }

      function saveDomain(domain, user, cb) {
        domain.administrator = user;
        domain.save(function(err, saved) {
          domain._id = saved._id;
          return cb(err, saved);
        });
      }

      var async = require('async');
      async.series([
        function(callback) {
          saveUser(foouser, callback);
        },
        function(callback) {
          saveUser(baruser, callback);
        },
        function(callback) {
          saveDomain(domain, foouser, callback);
        },
        function(callback) {
          bazuser.domains.push({domain_id: domain._id});
          saveUser(bazuser, callback);
        }
      ],
      function(err) {
        done(err);
      });
    });
  });

  afterEach(function(done) {
    var User = this.mongoose.model('User');
    var Domain = this.mongoose.model('Domain');
    User.remove(function() {
      Domain.remove(function(err) {
        require('mongoose').disconnect(done);
      });
    });
  });

  it('should not be able to send a domain invitation without being authenticated', function(done) {
    request(app)
      .post('/api/domains/' + domain._id + '/invitations')
      .expect(401)
      .end(done);
  });

  it('should be able to send a domain invitation when logged user is the domain manager', function(done) {
    request(app)
      .post('/api/login')
      .send({username: foouser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/domains/' + domain._id + '/invitations');
        req.cookies = cookies;
        req.send(['foo@bar.com']);
        req.expect(202).end(done);
      });
  });

  it('should be able to send a domain invitation when user belongs to the domain', function(done) {
    request(app)
      .post('/api/login')
      .send({username: bazuser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/domains/' + domain._id + '/invitations');
        req.cookies = cookies;
        req.send(['inviteme@open-paas.org']);
        req.expect(202).end(done);
      });
  });

  it('should not be able to send a domain invitation when user does not belongs to the domain', function(done) {
    request(app)
      .post('/api/login')
      .send({username: baruser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).post('/api/domains/' + domain._id + '/invitations');
        req.cookies = cookies;
        req.send(['inviteme@open-paas.org']);
        req.expect(403).end(done);
      });
  });

  it('should be able to get a domain information when current user is domain member', function(done) {
    request(app)
      .post('/api/login')
      .send({username: bazuser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).get('/api/domains/' + domain._id);
        req.cookies = cookies;
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body.administrator).to.equal('' + domain.administrator);
          expect(res.body.name).to.equal(domain.name);
          expect(res.body.company_name).to.equal(domain.company_name);
          done();
        });
      });
  });

  it('should not be able to get a domain information when current user is not domain member', function(done) {
    request(app)
      .post('/api/login')
      .send({username: baruser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).get('/api/domains/' + domain._id);
        req.cookies = cookies;
        req.expect(403).end(done);
      });
  });

  it('should be able to get a domain information when current user is domain manager', function(done) {
    request(app)
      .post('/api/login')
      .send({username: foouser.emails[0], password: password, rememberme: false})
      .expect(200)
      .end(function(err, res) {
        var cookies = res.headers['set-cookie'].pop().split(';')[0];
        var req = request(app).get('/api/domains/' + domain._id);
        req.cookies = cookies;
        req.expect(200).end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body.administrator).to.equal('' + domain.administrator);
          expect(res.body.name).to.equal(domain.name);
          expect(res.body.company_name).to.equal(domain.company_name);
          done();
        });
      });
  });

  it('should not be able to get a domain information when not logged in', function(done) {
    request(app)
      .get('/api/domains/' + domain._id)
      .expect(401).end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
  });

  it('GET /api/domains/:uuid/members should return 404 when domain is not found', function(done) {
    request(app).get('/api/domains/5331f287589a2ef541867680/members').expect(404).end(function(err, res) {
      expect(err).to.be.null;
      done();
    });
  });

  it('GET /api/domains/:uuid/members should return all the members of the domain and contain the list size in the header', function(done) {
    var d = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});
    d.save(function(err, domain) {
      if (err) {
        return done(err);
      }
      var u = new User({domains: [{domain_id: domain._id}], emails: ['test01@linagora.com']});

      u.save(function(err, user) {
        if (err) {
          return done(err);
        }
        request(app).get('/api/domains/' + domain._id + '/members').expect(200).end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body).to.be.not.null;
          expect(res.headers['x-esn-items-count']).to.exist;
          expect(res.headers['x-esn-items-count']).to.equal('1');
          done();
        });
      });
    });
  });

  it('GET /api/domains/:uuid/members should return all the members matching the search terms', function(done) {
    var foouser = new User({ firstname: 'foobarbaz', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ firstname: 'b', lastname: 'oofoo', password: 'secret', emails: ['barbar@bar.com'], login: { failures: [new Date()]}});
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
          request(app).get('/api/domains/' + domain._id + '/members').query({search: 'foo bar'}).expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.body).to.be.not.null;
            expect(res.body.length).to.equal(2);
            expect(res.body[0]._id).to.equal('' + bazuser._id);
            expect(res.body[1]._id).to.equal('' + foouser._id);
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal('2');
            done();
          });
        });
    });
  });

  it('GET /api/domains/:uuid/members should return the first 2 members', function(done) {
    var foouser = new User({ firstname: 'a', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ firstname: 'b', lastname: 'oofoo', password: 'secret', emails: ['barbar@bar.com'], login: { failures: [new Date()]}});
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
          request(app).get('/api/domains/' + domain._id + '/members').query({limit: 2}).expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.body).to.be.not.null;
            expect(res.body.length).to.equal(2);
            expect(res.body[0]._id).to.equal('' + foouser._id);
            expect(res.body[1]._id).to.equal('' + baruser._id);
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal('4');
            done();
          });
        });
    });
  });

  it('GET /api/domains/:uuid/members should return the last 2 members', function(done) {
    var foouser = new User({ firstname: 'a', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ firstname: 'b', lastname: 'oofoo', password: 'secret', emails: ['barbar@bar.com'], login: { failures: [new Date()]}});
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
          request(app).get('/api/domains/' + domain._id + '/members').query({offset: 2}).expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.body).to.be.not.null;
            expect(res.body.length).to.equal(2);
            expect(res.body[0]._id).to.equal('' + bazuser._id);
            expect(res.body[1]._id).to.equal('' + quxuser._id);
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal('4');
            done();
          });
        });
    });
  });

  it('GET /api/domains/:uuid/members should return the third member', function(done) {
    var foouser = new User({ firstname: 'a', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
    var baruser = new User({ firstname: 'b', lastname: 'oofoo', password: 'secret', emails: ['barbar@bar.com'], login: { failures: [new Date()]}});
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
          request(app).get('/api/domains/' + domain._id + '/members').query({limit: 1, offset: 2}).expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.body).to.be.not.null;
            expect(res.body.length).to.equal(1);
            expect(res.body[0]._id).to.equal('' + bazuser._id);
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal('4');
            done();
          });
        });
    });
  });

  it('POST /api/domains should fail when administrator is not set', function(done) {
    var json = {
      name: 'Marketing',
      company_name: 'Corporate'
    };

    request(app).post('/api/domains').send(json).expect(400).end(function(err, res) {
      expect(err).to.be.null;
      expect(res.body).to.be.not.null;
      done();
    });
  });

  it('POST /api/domains should fail when administrator user is not correctly filled (emails is mandatory)', function(done) {

    var u = new User({ firstname: 'foo', lastname: 'bar'});

    var json = {
      name: 'Marketing',
      company_name: 'Corporate',
      administrator: u
    };

    request(app).post('/api/domains').send(json).expect(400).end(function(err, res) {
      expect(err).to.be.null;
      expect(res.body).to.be.not.null;
      done();
    });
  });

  it('POST /api/domains should create a domain with name, company_name and administrator', function(done) {

    var u = new User({ firstname: 'foo', lastname: 'bar', emails: ['foo@linagora.com']});

    var json = {
      name: 'Marketing',
      company_name: 'Corporate',
      administrator: u
    };

    request(app).post('/api/domains').send(json).expect(201).end(function(err, res) {
      expect(err).to.be.null;
      expect(res.body).to.be.not.null;
      done();
    });
  });

});

