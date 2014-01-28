'use strict';

var BASEPATH = '../../../..';

var expect = require('chai').expect;
var mockery = require('mockery');
var request = require('supertest');
var path = require('path');
var fs = require('fs');

var tmp = path.resolve(__dirname + BASEPATH + '/../tmp');
var fixture = __dirname + '/../fixtures/config/settings.json';


describe('The Route Settings module', function() {
  it('should exist', function() {
    var settings = require(BASEPATH + '/backend/webserver/routes/settings');
    expect(settings).to.exists;
  });
});

describe('The settings routes resource', function() {

  beforeEach(function() {
    var configpath = path.normalize(__dirname + '/../fixtures/config');
    process.env.NODE_CONFIG = configpath;
    if (!fs.exists(tmp)) {
      try {
        fs.mkdirSync(tmp);
      } catch(err) {

      }
    }
  });

  afterEach(function() {
    process.env.NODE_CONFIG = null;
  });


  describe('GET /api/settings', function() {

    it('should fail by default', function () {
      var webserver = require(BASEPATH + '/backend/webserver');
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
      webserver.start(port);
      request(webserver.application).get('/api/settings').expect('Content-Type', /json/).expect(500).end(function(err, res) {
        expect(err).to.be.not.null;
      });
    });

    it('should not fail on valid data', function () {
      var data = fs.readFileSync(fixture);
      fs.writeFileSync(tmp + '/settings.json', data);

      var webserver = require(BASEPATH + '/backend/webserver');
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
      webserver.start(port);

      request(webserver.application).get('/api/settings').expect('Content-Type', /json/).expect(200).end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.be.not.null;
        expect(res.body).to.be.not.null;
      });
    });

  });

  describe('GET /api/settings/:name', function() {

    var data = fs.readFileSync(fixture);
    fs.writeFileSync(tmp + '/settings.json', data);

    it('should return error on null name', function () {
      var webserver = require(BASEPATH + '/backend/webserver');
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
      webserver.start(port);

      request(webserver.application).get('/api/settings/foo').expect('Content-Type', /json/).expect(500).end(function(err, res) {
        expect(err).to.be.null;
        console.log(res.body)
      });
    });

    it('should return value on right name parameter', function() {
      var webserver = require(BASEPATH + '/backend/webserver');
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
      webserver.start(port);

      request(webserver.application).get('/api/settings/mongo').expect('Content-Type', /json/).expect(200).end(function(err, res) {
        expect(err).to.be.null;
        expect(res).to.be.not.null;
        expect(res.body).to.be.not.null;
      });
    });
  });

  describe('POST /api/settings/:name', function() {

    var data = fs.readFileSync(fixture);
    var file = tmp + '/settings.json';
    fs.writeFileSync(file, data);

    it('should fail on empty name', function () {
      var webserver = require(BASEPATH + '/backend/webserver');
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
      webserver.start(port);

      request(webserver.application).post('/api/settings/').send({ url : 'foo'}).expect(404).end(function(err, res) {
        expect(err).to.be.null;
      });
    });

    it('should store data', function () {
      var webserver = require(BASEPATH + '/backend/webserver');
      var port = require(BASEPATH + '/backend/core').config('default').webserver.port;
      webserver.start(port);

      var url = 'imap://localhost';
      request(webserver.application).post('/api/settings/imap').send({url : url}).expect(200).end(function(err, res) {
        expect(err).to.be.null;
        var config = JSON.parse(fs.readFileSync(file));
        expect(config.imap).to.be.not.null;
        expect(config.imap.url).to.be.not.null;
        expect(config.imap.url).to.equal(url);
        expect(config.mongo.url).to.equals('mongodb://locahost:27017/foo');
      });
    });
  });
});