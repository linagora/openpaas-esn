'use strict';

var expect = require('chai').expect,
    request = require('supertest'),
    fs = require('fs-extra'),
    mockery = require('mockery');

describe('The document store Settings module', function() {
  it('should exist', function() {
    var settings = require(this.testEnv.basePath + '/backend/webserver/controllers/document-store');
    expect(settings).to.exists;

  });
});

describe('The document store routes resource', function() {
  var tmpDbConfigFile = null;

  beforeEach(function() {
    tmpDbConfigFile = this.testEnv.tmp + '/db.json';
    fs.copySync(this.testEnv.fixtures + '/config/db.json', tmpDbConfigFile);
  });

  afterEach(function() {
    try {
      fs.unlinkSync(tmpDbConfigFile);
    } catch (err) {}
  });

  describe('PUT /api/document-store/connection', function() {
    var webserver = null;

    beforeEach(function(done) {
      this.testEnv.initCore(function() {
        webserver = require(this.testEnv.basePath + '/backend/webserver');
        done();
      }.bind(this));
    });

    it('should fail on empty payload', function(done) {
      request(webserver.application).put('/api/document-store/connection').expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on missing hostname', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ port: 27017, dbname: 'hiveety'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on missing port', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', dbname: 'hiveety'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on missing dbname', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: 27017}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on any other JSON data', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ foo: 'bar', baz: 1}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on empty hostname', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: '', port: 27017, dbname: 'heevity'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on NaN port', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: '27017', dbname: 'heevity'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on port = 0', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: 0, dbname: 'heevity'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on port < 0', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: -10000, dbname: 'heevity'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on empty dbname', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: 27017, dbname: ''}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });


    it('should fail when username is set and password is not set', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: 27017, dbname: 'then', username: 'toto'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when username is set and password length is zero', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: 27017, dbname: 'then', username: 'toto', password: ''}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when username is not set and password is set', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: 27017, dbname: 'then', password: 'chain'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail when username is zero and password is set', function(done) {
      request(webserver.application).put('/api/document-store/connection').send({ hostname: 'localhost', port: 27017, dbname: 'then', username: '', password: 'chain'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should store configuration to file', function(done) {
      var mongo = { hostname: 'localhost', port: 27017, dbname: 'hiveety-test-ok'};
      var mongoConnectionString = 'mongodb://localhost:27017/hiveety-test-ok';

      request(webserver.application).put('/api/document-store/connection').send(mongo).expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;

        fs.readFile(tmpDbConfigFile, function(e, data) {
          expect(e).to.be.null;
          var json = JSON.parse(data);
          expect(json.connectionString).to.equal(mongoConnectionString);
          done();
        });
      });
    });

    it('should store configuration default options to file', function(done) {
      var mongo = { hostname: 'localhost', port: 27017, dbname: 'hiveety-test-ok'};

      request(webserver.application).put('/api/document-store/connection').send(mongo).expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;

        fs.readFile(tmpDbConfigFile, function(e, data) {
          expect(e).to.be.null;
          var json = JSON.parse(data);
          expect(json.connectionOptions).to.exist;
          expect(json.connectionOptions.server).to.exist;
          expect(json.connectionOptions.server.auto_reconnect).to.be.true;
          done();
        });
      });
    });


    it('should store configuration to file with username and password', function(done) {
      var mongo = { hostname: 'localhost', port: 27017, dbname: 'hiveety-test-ok', username: 'toto', password: 'chain'};
      var mongoConnectionString = 'mongodb://toto:chain@localhost:27017/hiveety-test-ok';

      request(webserver.application).put('/api/document-store/connection').send(mongo).expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;

        fs.readFile(tmpDbConfigFile, function(e, data) {
          expect(e).to.be.null;
          var json = JSON.parse(data);
          expect(json.connectionString).to.equal(mongoConnectionString);
          done();
        });
      });
    });

  });


  describe('The document store routes resource', function() {

    beforeEach(function(done) {
      this.testEnv.initCore(done);
    });


    it('should fail if the file is not written', function(done) {
      var config = require(this.testEnv.basePath + '/backend/core').config('default');
      config.core = config.core || {};
      config.core.config = config.core.config || {};
      config.core.config.db = 'somewhere/not/writable';

      var webserver = require(this.testEnv.basePath + '/backend/webserver');
      var port = require(this.testEnv.basePath + '/backend/core').config('default').webserver.port;
      webserver.start(port);

      var mongo = { hostname: 'localhost', port: 27017, dbname: 'hiveety-test-ok'};

      request(webserver.application).put('/api/document-store/connection')
      .send(mongo)
      .expect('Content-Type', /json/)
      .expect(function(res) {
        if (!res.body.error || !res.body.error.message) {
          return 'missing error.message property in body';
        }
        if (!res.body.error.details.match(/Can not write database settings in/) ||
            !res.body.error.details.match(/somewhere\/not\/writable/)) {
          return 'bad error message in body';
        }
      }).expect(500).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should call the mongo init() method after the file is written', function(done) {
      var mongoModule = require(this.testEnv.basePath + '/backend/core').db.mongo;

      var webserver = require(this.testEnv.basePath + '/backend/webserver');
      var port = require(this.testEnv.basePath + '/backend/core').config('default').webserver.port;
      webserver.start(port);

      mongoModule.init = done;

      var mongo = { hostname: 'localhost', port: 27017, dbname: 'hiveety-test-ok'};

      request(webserver.application).put('/api/document-store/connection').send(mongo).expect(201).end(function() {});
    });
  });

  describe('PUT /api/document-store/connection/:hostname/:port/:dbname', function() {

    it('should be successful with test database parameters', function(done) {
      this.testEnv.initCore(function() {
        var webserver = require(this.testEnv.basePath + '/backend/webserver');
        var uri = '/api/document-store/connection/localhost/' +
            this.testEnv.serversConfig.mongodb.port + '/' +
            this.testEnv.serversConfig.mongodb.dbname;
        request(webserver.application).put(uri).expect('Content-Type', /json/).expect(200).end(function(err, res) {
          expect(err).to.be.null;
          done();
        });
      }.bind(this));
    });

    it('should fail on localhost with invalid port', function(done) {
      this.testEnv.initCore(function() {
        // set higher timeout than the mongo one so we can catch error
        this.timeout(30000);
        var webserver = require(this.testEnv.basePath + '/backend/webserver');
        var port = require(this.testEnv.basePath + '/backend/core').config('default').webserver.port;
        webserver.start(port);

        var findport = require('find-port');
        findport(27020, 27050, function(ports) {
          expect(ports).to.have.length.of.at.least(1);
          request(webserver.application).put('/api/document-store/connection/localhost/' + ports[0] + '/rsetest').expect('Content-Type', /json/).expect(503).end(function(err, res) {
            expect(err).to.be.null;
            done();
          });
        });
      }.bind(this));
    });

    it('should call the mongodb.validateConnection method with credentials when they are set', function(done) {
      this.mongoDbMock = {
        init: function() {},
        validateConnection: function(hostname, port, dbname, username, password, callback) {
          expect(hostname).to.equal('localhost');
          expect(port).to.equal('42');
          expect(dbname).to.equal('rsetest');
          expect(username).to.equal('john');
          expect(password).to.equal('doe');
          done();
        }
      };

      mockery.registerMock('./mongo', this.mongoDbMock);
      this.testEnv.initCore(function() {
        var middleware = require(this.testEnv.basePath + '/backend/webserver/controllers/document-store');
        var requestMock = {
          params: {
            hostname: 'localhost',
            port: '42',
            dbname: 'rsetest'
          },
          body: {
            username: 'john',
            password: 'doe'
          }
        };

        var responseMock = {
          json: function() {}
        };

        middleware.test(requestMock, responseMock);
      }.bind(this));
    });

  });
});
