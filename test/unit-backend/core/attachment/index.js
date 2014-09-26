'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The attachment module', function() {

  describe('storeAttachment method', function() {

    it('should throw an error if name is not defined', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      var metaData = {
        name: null,
        contentType: 'text'
      };
      attachmentModule.storeAttachment(metaData, {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if contentType is not defined', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      var metaData = {
        name: 'file.txt',
        contentType: ''
      };
      attachmentModule.storeAttachment(metaData, {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if stream is not defined', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      var metaData = {
        name: 'file.txt',
        contentType: 'text'
      };
      attachmentModule.storeAttachment(metaData, null, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if the file storage fails', function() {
      var metaData = {
        name: 'file.txt',
        contentType: 'text',
        length: 1
      };
      var filestoreMock = {
        store: function(id, type, opts, stream, callback) {
          expect(id).to.exist;
          expect(type).to.equal(metaData.contentType);
          callback(new Error());
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment(metaData, {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should build the attachment model', function() {
      var metaData = {
        name: 'file.txt',
        contentType: 'text'
      };
      var fileId;
      var length = 123;
      var filestoreMock = {
        store: function(id, type, opts, stream, callback) {
          expect(id).to.exist;
          fileId = id;
          expect(type).to.equal(metaData.contentType);
          callback(null);
        },
        getAsFileStoreMeta: function(gridfsMeta) {
          return {
            length: length
          };
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment(metaData, {}, function(err, attachmentModel) {
        expect(err).to.not.exist;
        expect(attachmentModel.name).to.equal(metaData.name);
        expect(attachmentModel.contentType).to.equal(metaData.contentType);
        expect(attachmentModel.file).to.equal(fileId);
        expect(attachmentModel.length).to.equal(length);
      });
    });

  });


  describe('getAttachmentFile method', function() {

    it('should throw an error if attachment id is null', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.getAttachmentFile(null, function(err, fileMetaData, fileStream) {
        expect(err).to.exist;
        expect(fileMetaData).to.not.exist;
        expect(fileStream).to.not.exist;
      });
    });

    it('should throw an error if the file store throws one', function() {
      var attachment = {
        _id: '123',
        file: '456'
      };

      var filestoreMock = {
        get: function(id, callback) {
          expect(id).to.equal(attachment.file);
          callback(new Error());
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.getAttachmentFile(attachment, function(err, fileMetaData, fileStream) {
        expect(err).to.exist;
        expect(fileMetaData).to.not.exist;
        expect(fileStream).to.not.exist;
      });
    });

    it('should return the correct file from the file store', function() {
      var attachment = {
        _id: '123',
        file: '456'
      };
      var meta = {
        meta1: 'meta1'
      };
      var stream = 'file stream';

      var filestoreMock = {
        get: function(id, callback) {
          expect(id).to.equal(attachment.file);
          callback(null, meta, stream);
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.getAttachmentFile(attachment, function(err, fileMetaData, fileStream) {
        expect(err).to.not.exist;
        expect(fileMetaData).to.deep.equal(meta);
        expect(fileStream).to.deep.equal(stream);
      });
    });

  });

});
