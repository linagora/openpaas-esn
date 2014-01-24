'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Setup Angular module', function() {
  beforeEach(angular.mock.module('setupApp'));



  describe('wizardController', function() {
    beforeEach(inject(function($rootScope, $controller) {
      this.setupAPImock = {};
      this.scope = $rootScope.$new();
      $controller('wizardController', {
        $scope: this.scope,
        setupAPI: this.setupAPImock
      });
    }));

    it('should start at step 0', function() {
      expect(this.scope.step).to.equals(0);
    });

    describe('infocomplete method', function() {
      it('should return false if no hostname set', function() {
        this.scope.settings.hostname = null;
        this.scope.settings.dbname = 'bonjour';
        this.scope.settings.port = 334;
        expect(this.scope.infocomplete()).to.be.false;
      });
      it('should return false if no port set', function() {
        this.scope.settings.hostname = 'hi';
        this.scope.settings.dbname = 'bonjour';
        this.scope.settings.port = null;
        expect(this.scope.infocomplete()).to.be.false;
      });
      it('should return false if no dbname set', function() {
        this.scope.settings.hostname = 'hi';
        this.scope.settings.dbname = '';
        this.scope.settings.port = 3245;
        expect(this.scope.infocomplete()).to.be.false;
      });
      it('should return true if all data is set', function() {
        this.scope.settings.hostname = 'hi';
        this.scope.settings.dbname = 'there';
        this.scope.settings.port = 3245;
        expect(this.scope.infocomplete()).to.be.true;
      });
    });

    describe('testConnection()', function() {
      it('should call the setupAPI.testConnection() method', function(done) {
        this.setupAPImock.testConnection = function() {
          done();
        };
        this.scope.testConnection();
      });

      it('should call the setupAPI.testConnection() method with scope database settings', function(done) {
        this.scope.settings.hostname = 'hi';
        this.scope.settings.dbname = 'there';
        this.scope.settings.port = 42;
        this.setupAPImock.testConnection = function(host, port, dbname) {
          expect(host).to.equal('hi');
          expect(port).to.equal(42);
          expect(dbname).to.equal('there');
          done();
        };
        this.scope.testConnection();
      });

    });

    describe('recordSettings()', function() {
      it('should call the setupAPI.recordSettings() method', function(done) {
        this.setupAPImock.recordSettings = function() {
          done();
        };
        this.scope.recordSettings();
      });

      it('should call the setupAPI.recordSettings() method with scope database settings', function(done) {
        this.scope.settings.hostname = 'hi';
        this.scope.settings.dbname = 'there';
        this.scope.settings.port = 42;
        this.setupAPImock.recordSettings = function(settings) {
          expect(settings.hostname).to.equal('hi');
          expect(settings.port).to.equal(42);
          expect(settings.dbname).to.equal('there');
          done();
        };
        this.scope.recordSettings();
      });

    });


  });

  describe('setupAPI service', function() {
    beforeEach(angular.mock.inject(function(setupAPI, $httpBackend) {
      this.setupAPI = setupAPI;
      this.$httpBackend = $httpBackend;
    }));

    describe('The testConnection method', function() {
      it('should issue a GET request to /api/setup/database/test/connection/:hostname/:port/:dbname', function(done) {
        var responseData = {};
        this.$httpBackend.expectGET('/api/setup/database/test/connection/hi/80/there').respond(200, responseData);
        var promise = this.setupAPI.testConnection('hi', 80, 'there');
        expect(promise).to.be.an.object;
        expect(promise).to.have.property('then');
        expect(promise.then).to.be.a.function;
        promise.then(function(response) {
          expect(response.data).to.deep.equal(responseData);
          done();
        },function() {done();});

        this.$httpBackend.flush();
      });
    });

    describe('The recordSettings method', function() {
      it('should issue a PUT request to /api/setup/settings', function(done) {
        var responseData = {};

        this.$httpBackend.expectPUT('/api/setup/settings', {
          hostname: 'hi',
          port: 80,
          dbname: 'there'
        }).respond(200, responseData);

        var promise = this.setupAPI.recordSettings({
          hostname: 'hi',
          port: 80,
          dbname: 'there'
        });

        expect(promise).to.be.an.object;
        expect(promise).to.have.property('then');
        expect(promise.then).to.be.a.function;
        promise.then(function(response) {
          expect(response.data).to.deep.equal(responseData);
          done();
        },function() {done();});

        this.$httpBackend.flush();
      });
    });


  });

});
