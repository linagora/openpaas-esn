'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esn.file-preview.image module', function() {
    var $q,
        $rootScope,
        $compile,
        $httpBackend,
        filePreviewService;

    beforeEach(function() {
      angular.mock.module('jadeTemplates');
      angular.mock.module('esn.file-preview');
      angular.mock.module('esn.file-preview.image', function($provide) {
        $provide.value('filePreviewService', {
          addFilePreviewProvider: sinon.spy()
        });
      });
    });

    beforeEach(angular.mock.inject(function(_$q_, _$rootScope_, _$compile_, _$httpBackend_, _filePreviewService_) {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $httpBackend = _$httpBackend_;
      filePreviewService = _filePreviewService_;
    }));

    describe('The filePreviewImage directive', function() {
      var file,
          $scope,
          element;

      function initDirective() {
        $scope = $rootScope.$new();
        $scope.image = file;
        element = $compile('<div><file-preview-image file="image" /></div>')($scope);
        $scope.$digest();
      }

      it('should call the template file', function() {
        file = {
          _id: 'abcd',
          contentType: 'image/png',
          name: 'test'
        };
        initDirective();
        expect(angular.element(element.find('file-preview-image img')).length).to.be.equal(1);
      });
    });

    describe('The run function', function() {
      it('should register the provider in esn.file-preview', function() {
        expect(filePreviewService.addFilePreviewProvider).to.be.calledWith({
          name: 'image',
          contentType: ['image/png', 'image/x-png', 'image/jpeg', 'image/pjpeg', 'image/gif']
        });
      });
    });
  });
