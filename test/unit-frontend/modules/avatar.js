'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Avatar Angular module', function() {
  beforeEach(angular.mock.module('esn.avatar'));

  describe('imgLoaded directive', function() {
    var html = '<img-loaded width="512"/>';
    beforeEach(inject(['$compile', '$rootScope', 'selectionService', function($c, $r, selectionService) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.selectionService = selectionService;
    }]));

    it('should draw the loaded image in a canvas on crop:loaded event', function(done) {
      var img = {img: 'mock'};
      this.selectionService.image = img;
      var element = this.$compile(html)(this.$rootScope);
      var document = element[0].ownerDocument;
      var create = document.createElement;

      var drawImage = function(image) {
        document.createElement = create;
        expect(image).to.equal(img);
        done();
      };

      document.createElement = function() {
        return {
          getContext: function() {
            return {
              drawImage: drawImage
            };
          }
        };
      };
      this.$rootScope.$broadcast('crop:loaded');
    });
  });

  describe('loadButton directive', function() {
    var html = '<input type="file" load-button/>';
    beforeEach(inject(['$compile', '$rootScope', 'selectionService', function($c, $r, selectionService) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.selectionService = selectionService;
    }]));

    it('should set an error in the scope if file is not set', function(done) {
      var element = this.$compile(html)(this.$rootScope);
      this.$rootScope.$digest();
      element.trigger('change');
      expect(this.selectionService.getError()).to.equal('Wrong file type, please select a valid image');
      done();
    });
  });

  describe('selectionService service', function() {

    beforeEach(angular.mock.inject(function(selectionService, $rootScope) {
      this.selectionService = selectionService;
      this.$rootScope = $rootScope;
    }));

    it('should fire an event to crop:loaded topic when setting an image', function(done) {
      var image = 'foo.png';

      this.$rootScope.$broadcast = function(topic) {
        expect(topic).to.equal('crop:loaded');
        done();
      };
      this.selectionService.setImage(image);
    });

    it('should broadcast x to crop:selected topic when calling broadcastSelection(x)', function(done) {
      var selection = {x: 0, y: 1};

      this.$rootScope.$broadcast = function(topic, data) {
        expect(topic).to.equal('crop:selected');
        expect(data).to.equal(selection);
        done();
      };
      this.selectionService.broadcastSelection(selection);
    });

    it('should save the input image', function(done) {
      var input = 'foo.png';
      this.selectionService.setImage(input);
      expect(this.selectionService.image).to.equal(input);
      done();
    });

    it('should save the error', function(done) {
      var error = 'fail';
      this.selectionService.setError(error);
      expect(this.selectionService.error).to.equal(error);
      done();
    });

    it('should broadcast the error to crop:error topic when calling setError(err)', function(done) {
      var error = 'fail';

      this.$rootScope.$broadcast = function(topic, data) {
        expect(topic).to.equal('crop:error');
        expect(data).to.equal(error);
        done();
      };
      this.selectionService.setError(error);
    });

    it('should return the stored image when calling getImage', function(done) {
      var input = 'foo.png';
      this.selectionService.image = input;
      var image = this.selectionService.getImage();
      expect(image).to.equal(input);
      done();
    });
  });

  describe('avatarEdit controller', function() {
    beforeEach(angular.mock.inject(function(selectionService, avatarAPI, $rootScope, $controller) {
      this.selectionService = selectionService;
      this.$rootScope = $rootScope;
      this.avatarAPI = avatarAPI;
      this.scope = $rootScope.$new();

      $controller('avatarEdit', {
        $rootScope: this.$rootScope,
        $scope: this.scope,
        selectionService: this.selectionService,
        avatarAPI: this.avatarAPI
      });
    }));

    it('should call the avatarAPI when calling send function', function(done) {
      this.avatarAPI.uploadAvatar = function() {
        done();
      };
      this.scope.send('foo', 'bar');
      done();
    });

  });

  describe('avatarAPI service', function() {
    beforeEach(angular.mock.inject(function(selectionService, $rootScope, $httpBackend, avatarAPI) {
      this.selectionService = selectionService;
      this.$rootScope = $rootScope;
      this.avatarAPI = avatarAPI;
      this.$httpBackend = $httpBackend;
    }));

    it('should send POST to /api/user/profile/avatar with valid mime, parameters and blob', function() {
      var blob = '123';
      var mime = 'image/png';

      this.$httpBackend.expectPOST('/api/user/profile/avatar?mimetype=image%2Fpng', blob).respond(200);
      this.avatarAPI.uploadAvatar(blob, mime);
      this.$httpBackend.flush();
    });

    it('should return a promise', function() {
      var promise = this.avatarAPI.uploadAvatar('foo', 'bar');
      expect(promise.then).to.be.a.function;
    });
  });
});
