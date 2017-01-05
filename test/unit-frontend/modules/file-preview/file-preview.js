'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.file-preview module', function() {
    var $rootScope, $compile;

    beforeEach(function() {
      angular.mock.module('jadeTemplates');
      angular.mock.module('esn.file-preview');
      angular.mock.module('esn.lodash-wrapper');
      angular.mock.module('esn.file-preview.image');
    });

    beforeEach(angular.mock.inject(function(_$rootScope_, _$compile_) {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
    }));

    describe('The filePreview directive', function() {
      var file,
          $scope,
          element;

      function initDirective() {
        $scope = $rootScope.$new();
        $scope.image = file;
        element = $compile('<div><file-preview file="image" /></div>')($scope);
        $scope.$digest();
      }

      it('should call the file-preview-image directive if the file is a image', function() {
        file = {
          _id: 'abcd',
          contentType: 'image/png'
        };
        initDirective();
        expect(angular.element(element.find('file-preview file-preview-image')).length).to.be.equal(1);
      });

      it('should call the esn-attachment component if the file have a unsupported contentType', function() {
        file = {
          _id: 'abcd',
          contentType: 'video/avi'
        };
        initDirective();
        expect(angular.element(element.find('file-preview esn-attachment')).length).to.be.equal(1);
      });
    });
  });
