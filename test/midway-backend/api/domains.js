'use strict';

var expect = require('chai').expect;
var request = require('supertest');
var mockery = require('mockery');

describe.skip('The domains controller', function() {

  before(function() {
    this.mongoose = require('mongoose');
    this.testEnv.writeDBConfigFile();
    this.mongoose.connect(this.testEnv.mongoUrl);
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  beforeEach(function(done) {
    this.testEnv.initCore(done);
  });

  describe('GET /api/domains/:uuid/members', function() {
    var email = 'foo@linagora.com';
    var Domain, User, webserver;

    beforeEach(function(done) {
      Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      webserver = require(this.testEnv.basePath + '/backend/webserver');
      done();
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

    it('should return 404 when domain is not found', function(done) {
      request(webserver.application).get('/api/domains/5331f287589a2ef541867680/members').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return all the members of the domain and contain the list size in the header', function(done) {
      var d = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});
      d.save(function(err, domain) {
        if (err) {
          return done(err);
        }
        var u = new User({domains: [{domain_id: domain._id}], emails: [email]});

        u.save(function(err, user) {
          if (err) {
            return done(err);
          }
          request(webserver.application).get('/api/domains/' + domain._id + '/members').expect(200).end(function(err, res) {
            expect(err).to.be.null;
            expect(res.body).to.be.not.null;
            expect(res.headers['x-esn-items-count']).to.exist;
            expect(res.headers['x-esn-items-count']).to.equal('1');
            done();
          });
        });
      });
    });

    it('should return all the members matching the search terms', function(done) {
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
          request(webserver.application).get('/api/domains/' + domain._id + '/members').query({search: 'foo bar'}).expect(200).end(function(err, res) {
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

    it('should return the first 2 members', function(done) {
      var foouser = new User({ firstname: 'a', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
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
          request(webserver.application).get('/api/domains/' + domain._id + '/members').query({limit: 2}).expect(200).end(function(err, res) {
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

    it('should return the last 2 members', function(done) {
      var foouser = new User({ firstname: 'a', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
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
          request(webserver.application).get('/api/domains/' + domain._id + '/members').query({offset: 2}).expect(200).end(function(err, res) {
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

    it('should return the third member', function(done) {
      var foouser = new User({ firstname: 'a', password: 'secret', emails: ['me@bar.com'], login: { failures: [new Date()]}});
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
            request(webserver.application).get('/api/domains/' + domain._id + '/members').query({limit: 1, offset: 2}).expect(200).end(function(err, res) {
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
  });

  describe('POST /api/domains/createDomain/', function() {
    var webserver = null;
    var Domain;
    var User;

    var emails = [];
    var email = 'foo@linagora.com';
    var email2 = 'bar@linagora.com';

    beforeEach(function() {
      Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      User = require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should fail when administrator is not set', function(done) {
      var json = {
        name: 'Marketing',
        company_name: 'Corporate'
      };

      request(webserver.application).post('/api/domains').send(json).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when administrator user is not correctly filled (emails is mandatory)', function(done) {

      var u = new User({ firstname: 'foo', lastname: 'bar'});

      var json = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: u
      };

      request(webserver.application).post('/api/domains').send(json).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should create a domain with name, company_name and administrator', function(done) {

      emails.push(email);
      emails.push(email2);
      var u = new User({ firstname: 'foo', lastname: 'bar', emails: emails});

      var json = {
        name: 'Marketing',
        company_name: 'Corporate',
        administrator: u
      };

      request(webserver.application).post('/api/domains').send(json).expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });
  });

  describe('The load domain middleware', function() {

    var Domain;

    beforeEach(function(done) {
      Domain = require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
      done();
    });

    afterEach(function(done) {
      var callback = function(item, fn) {
        item.remove(fn);
      };

      var async = require('async');
      async.parallel([
        function(cb) {
          Domain.find().exec(function(err, domains) {
            async.forEach(domains, callback, cb);
          });
        }
      ], function() {
        this.mongoose.disconnect(done);
      }.bind(this));
    });

    it('should call next(err) if domain can not be loaded', function(done) {
      var req = {
        params: {
          uuid: '123'
        }
      };
      var res = {};
      var next = function(err) {
        expect(err).to.exist;
        done();
      };

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.load(req, res, next);
    });

    it('should send 404 if domain is not found', function(done) {
      // this is just used to generate a valid uuid
      var domain = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});
      console.log(domain._id);

      var req = {
        params: {
          uuid: domain._id
        }
      };

      var res = {
        send: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      var next = function() {};

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.load(req, res, next);
    });

    it('should inject the domain into the request', function(done) {
      var domain = new Domain({name: 'MyDomain', company_name: 'MyAwesomeCompany'});
      var self = this;

      domain.save(function(err, saved) {
        if (err) {
          return done(err);
        }

        var req = {
          params: {
            uuid: saved._id
          }
        };

        var res = {
        };

        var next = function() {
          expect(req.domain).to.exist;
          expect(req.domain._id).to.deep.equal(saved._id);
          done();
        };

        var controller = require(self.testEnv.basePath + '/backend/webserver/controllers/domains');
        controller.load(req, res, next);
      });
    });
  });

  describe('The sendInvitations fn', function() {

    var Invitation;

    beforeEach(function(done) {
      Invitation = require(this.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
      done();
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
        this.mongoose.disconnect(done);
      }.bind(this));
    });

    it('should fail if request body is empty', function(done) {
      var req = {};
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should fail if request body is not an array', function(done) {
      var req = {
        body: {}
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(400);
          done();
        }
      };
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should send HTTP 202 if request body is an array', function(done) {
      var req = {
        body: [],
        user: {
          _id: 123
        },
        domain: {
          _id: 456
        }
      };
      var res = {
        send: function(status) {
          expect(status).to.equal(202);
          done();
        }
      };
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub when invitations are sent', function(done) {
      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(null, true);
        },
        init: function(invitation, cb) {
          return cb(null, true);
        }
      };
      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        }
      };

      var res = {
        send: function() {
        }
      };

      var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        done();
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub even if handler#validate is throwing an error', function(done) {
      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(new Error('Fail!'));
        },
        init: function(invitation, cb) {
          return cb(null, true);
        }
      };
      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        }
      };

      var res = {
        send: function() {
        }
      };

      var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        expect(message.emails).to.be.empty;
        done();
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });

    it('should publish a notification to the local pubsub even if handler#init is throwing an error', function(done) {
      var handlerMock = {
        validate: function(invitation, cb) {
          return cb(null, true);
        },
        init: function(invitation, cb) {
          return cb(new Error('Fail!'));
        }
      };
      mockery.registerMock('../../core/invitation', handlerMock);

      var req = {
        body: ['foo@bar.com', 'bar@baz.com'],
        user: {
          _id: 123456789
        },
        domain: {
          _id: 987654321
        },
        get: function() {
          return '';
        }
      };

      var res = {
        send: function() {
        }
      };

      var pubsub = require(this.testEnv.basePath + '/backend/core/pubsub').local;
      pubsub.topic('domain:invitations:sent').subscribe(function(message) {
        expect(message).to.exist;
        expect(message.user).to.exist;
        expect(message.domain).to.exist;
        expect(message.emails).to.exist;
        expect(message.emails).to.be.empty;
        done();
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.sendInvitations(req, res);
    });
  });

  describe('The getDomain fn', function() {
    it('should return HTTP 404 when domain is not available in the request', function(done) {
      var req = {
      };
      var res = {
        json: function(status) {
          expect(status).to.equal(404);
          done();
        }
      };
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.getDomain(req, res);
    });

    it('should return HTTP 200 when domain is available in the request', function(done) {
      var req = {
        domain: {}
      };
      var res = {
        json: function(status, domain) {
          expect(status).to.equal(200);
          expect(domain).to.exist;
          done();
        }
      };
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/domains');
      controller.getDomain(req, res);
    });
  });
});
