'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.parser Angular module', function() {

  beforeEach(angular.mock.module('esn.parser'));

  describe('parserResolver service', function() {

    beforeEach(angular.mock.inject(function(parserResolver, $rootScope) {
      this.parserResolver = parserResolver;
      this.$rootScope = $rootScope;
    }));

    describe('register() method', function() {
      it('should send back error if inputs are not defined', function() {
        expect(this.parserResolver.register).to.throw(Error);
      });

      it('should send back error if parserName is not defined', function(done) {
        try {
          this.parserResolver.register(null, function() {});
        } catch (err) {
          return done();
        }
        done(new Error());
      });

      it('should send back error if resolver is not defined', function(done) {
        try {
          this.parserResolver.register('markdown', null);
        } catch (err) {
          return done();
        }
        done(new Error());
      });

      it('should send be ok when parameters are valid', function(done) {
        try {
          this.parserResolver.register('markdown', function() {});
        } catch (err) {
          return done(new Error());
        }
        return done();
      });
    });

    describe('resolve() method', function() {
      it('should get a promise reject when parser is not defined', function(done) {
        this.parserResolver.resolve(null, '1').then(function() {
          return done(new Error());
        }, function(err) {
          expect(err).to.exist;
          return done();
        });
        this.$rootScope.$digest();
      });

      it('should get a promise reject when text is not defined', function(done) {
        this.parserResolver.resolve('markdown', null).then(function() {
          return done(new Error());
        }, function(err) {
          expect(err).to.exist;
          return done();
        });
        this.$rootScope.$digest();
      });

      it('should get a promise reject when resolver does not exist', function(done) {
        this.parserResolver.resolve('mark down', '1').then(function() {
          return done(new Error());
        }, function(err) {
          expect(err).to.exist;
          return done();
        });
        this.$rootScope.$digest();
      });
    });

    describe('resolveChain() method', function() {
      it('should get a promise reject when parsers is not defined', function(done) {
        this.parserResolver.resolveChain(null, 'text').then(function() {
          return done(new Error());
        }, function(err) {
          expect(err).to.exist;
          return done();
        });
        this.$rootScope.$digest();
      });

      it('should get a promise reject when parsers is not an array', function(done) {
        this.parserResolver.resolveChain({}, 'text').then(function() {
          return done(new Error());
        }, function(err) {
          expect(err).to.exist;
          return done();
        });
        this.$rootScope.$digest();
      });

      it('should get a promise reject when text is not defined', function(done) {
        this.parserResolver.resolveChain([], null).then(function() {
          return done(new Error());
        }, function(err) {
          expect(err).to.exist;
          return done();
        });
        this.$rootScope.$digest();
      });

      it('should get a promise reject when parser.name is not defined', function(done) {
        this.parserResolver.resolveChain(['markdown'], 'text').then(function() {
          return done(new Error());
        }, function(err) {
          expect(err).to.exist;
          return done();
        });
        this.$rootScope.$digest();
      });
    });

    describe('register then resolve', function() {
      it('should call the registered resolver', function(done) {
        var parserName = 'markdown';
        var text = '123';
        var call;

        var resolver = function(text) {
          call = text;
          return $q.when(text);
        };

        this.parserResolver.register(parserName, resolver);
        this.parserResolver.resolve(parserName, text).then(function(result) {

          expect(result).to.exist;
          expect(result).to.deep.equal(text);
          expect(call).to.equal(text);
          done();

        }, function(err) {
          return done(err);
        });
        this.$rootScope.$digest();
      });

      it('should call the registered resolver with resolverChain', function(done) {
        var parser1 = function(text) {
          return $q.when(text + 'parser1');
        };

        var parser2 = function(text) {
          return $q.when(text + 'parser2');
        };

        this.parserResolver.register('parser1', parser1);
        this.parserResolver.register('parser2', parser2);
        this.parserResolver.resolveChain([{name: 'parser1'}, {name: 'parser2'}], 'text').then(function(result) {
          expect(result).to.exist;
          expect(result).to.deep.equal('textparser1parser2');
          done();
        });
        this.$rootScope.$digest();
      });
    });
  });

  describe('textParser directive', function() {
    var parserResolverMock = {};

    function setupMock() {
      parserResolverMock.resolveChain = function resolveChain(parsers, text) {
        return $q.when(text);
      };
    }

    beforeEach(function() {
      angular.mock.module(function($provide) {
        $provide.value('parserResolver', parserResolverMock);
      });
    });

    beforeEach(inject(function($rootScope, $compile) {
      this.$rootScope = $rootScope;
      this.scope = $rootScope.$new();
      this.$compile = $compile;
      setupMock();
    }));

    it('should do nothing without parameter', function(done) {
      this.html = '<text-parser></text-parser>';
      this.$compile(this.html)(this.scope);
      done();
    });

    it('should write the text without modification', function(done) {
      this.html = '<text-parser text="text"></text-parser>';
      var element = this.$compile(this.html)(this.scope);
      expect(element.html()).to.equal('text');
      done();
    });

    it('should write the text parse with linky', function(done) {
      this.html = '<text-parser text="http://google.com"></text-parser>';
      var element = this.$compile(this.html)(this.scope);
      expect(element.html()).to.equal('<a target="_blank" href="http://google.com">http://google.com</a>');
      done();
    });

    it('should parse the text with all parsers', function(done) {
      parserResolverMock.resolveChain = function resolveChain(parsers, text) {
        expect(parsers).to.exist;
        expect(text).to.exist;
        expect(parsers).to.deep.equal([{name: 'markdown'}]);
        expect(text).to.equal('text');
        return $q.when(text + 'parser');
      };
      this.html = '<text-parser parsers=\'[{"name":"markdown"}]\' text="text"></text-parser>';
      var element = this.$compile(this.html)(this.scope);
      this.scope.$digest();
      expect(element.html()).to.equal('textparser');
      done();
    });
  });
});
