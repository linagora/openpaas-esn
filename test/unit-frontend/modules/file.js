'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The esn.file module', function() {

  beforeEach(angular.mock.module('esn.file'));

  describe('The contentTypeService service', function() {

    describe('The getExtension fn', function() {

      beforeEach(angular.mock.inject(function(contentTypeService) {
        this.contentTypeService = contentTypeService;
      }));

      it('should return undefined for unknown type', function() {
        expect(this.contentTypeService.getExtension('foo/bar')).to.be.undefined;
      });

      it('should return undefined for undefined type', function() {
        expect(this.contentTypeService.getExtension()).to.be.undefined;
      });

      it('should return valid extension', function() {
        expect(this.contentTypeService.getExtension('application/json')).to.equal('json');
      });
    });

    describe('The getType fn', function() {

      beforeEach(angular.mock.inject(function(contentTypeService) {
        this.contentTypeService = contentTypeService;
      }));

      it('should return undefined for undefined type', function() {
        expect(this.contentTypeService.getType()).to.be.undefined;
      });

      it('should return undefined for invalid type', function() {
        expect(this.contentTypeService.getType('abcde')).to.be.undefined;
      });

      it('should return valid type', function() {
        expect(this.contentTypeService.getType('application/json')).to.equal('application');
      });
    });
  });

  describe('The extension filter', function() {

    var extension;
    beforeEach(inject(function($filter) {
      extension = $filter('extension');
    }));

    it('should return valid extension on standard content type', function() {
      expect(extension('application/pdf')).to.equal('pdf');
    });

    it('should return undefined extension on unknown content type', function() {
      expect(extension('foo/bar')).to.be.undefined;
    });
  });
});