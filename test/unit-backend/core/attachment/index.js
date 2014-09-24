'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The attachment module', function() {

  beforeEach(function() {
    this.mongoose = require(this.testEnv.fixtures + '/mongoose').mongoose();
    mockery.registerMock('mongoose', this.mongoose);
  });

  describe('storeAttachment method', function() {

    it('should throw an error if name is not defined', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment(null, '', 1, {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if contentType is not defined', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment('file.txt', '', 1, {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if length is not defined', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment('file.txt', 'text', null, {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if length is NaN', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment('file.txt', 'text', 'NaN', {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if stream is not defined', function() {
      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment('file.txt', 'text', 1, null, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if the file storage fails', function() {
      var contentType = 'text';
      var filestoreMock = {
        store: function(id, type, opts, stream, callback) {
          expect(id).to.exist;
          expect(type).to.equal(contentType);
          callback(new Error());
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment('file.txt', contentType, 1, {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should throw an error if the attachment model creation fails', function() {
      var fileName = 'file.txt';
      var contentType = 'text';
      var length = 1;
      var filestoreMock = {
        store: function(id, type, opts, stream, callback) {
          expect(id).to.exist;
          expect(type).to.equal(contentType);
          callback(null);
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      this.mongoose.model = function(name) {
        return {
          save: function(model, callback) {
            expect(name).to.equal('Attachment');
            expect(model.name).to.equal(fileName);
            expect(model.contentType).to.equal(contentType);
            expect(model.length).to.equal(length);
            callback(new Error());
          }
        };
      };

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment(fileName, contentType, length, {}, function(err, savedAttachment) {
        expect(err).to.exist;
        expect(savedAttachment).to.not.exist;
      });
    });

    it('should store the file and create the associated Attachment model', function() {
      var fileName = 'file.txt';
      var contentType = 'text';
      var length = 1;
      var savedAttachment = {
        name: fileName
      };
      var filestoreMock = {
        store: function(id, type, opts, stream, callback) {
          expect(id).to.exist;
          expect(type).to.equal(contentType);
          callback(null);
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      this.mongoose.model = function(name) {
        return {
          save: function(model, callback) {
            expect(name).to.equal('Attachment');
            expect(model.name).to.equal(fileName);
            expect(model.contentType).to.equal(contentType);
            expect(model.length).to.equal(length);
            callback(null, savedAttachment);
          }
        };
      };

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.storeAttachment(fileName, contentType, length, {}, function(err, saved) {
        expect(err).to.not.exist;
        expect(saved).deep.equal(savedAttachment);
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

    it('should throw an error if no attachment can be found', function() {
      var id = '123';
      this.mongoose.model = function(name) {
        return {
          findById: function(id, callback) {
            expect(name).to.equal('Attachment');
            callback(new Error());
          }
        };
      };

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.getAttachmentFile(id, function(err, fileMetaData, fileStream) {
        expect(err).to.exist;
        expect(fileMetaData).to.not.exist;
        expect(fileStream).to.not.exist;
      });
    });

    it('should throw an error if the file store throws one', function() {
      var attachmentId = '123';
      var fileId = '456';

      this.mongoose.model = function(name) {
        return {
          findById: function(id, callback) {
            expect(name).to.equal('Attachment');
            callback(null, {file: fileId});
          }
        };
      };

      var filestoreMock = {
        get: function(id, callback) {
          expect(id).to.equal(fileId);
          callback(new Error());
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.getAttachmentFile(attachmentId, function(err, fileMetaData, fileStream) {
        expect(err).to.exist;
        expect(fileMetaData).to.not.exist;
        expect(fileStream).to.not.exist;
      });
    });

    it('should return the correct file from the file store', function() {
      var attachmentId = '123';
      var fileId = '456';
      var meta = {
        meta1: 'meta1'
      };
      var stream = 'file stream';

      this.mongoose.model = function(name) {
        return {
          findById: function(id, callback) {
            expect(name).to.equal('Attachment');
            callback(null, {file: fileId});
          }
        };
      };

      var filestoreMock = {
        get: function(id, callback) {
          expect(id).to.equal(fileId);
          callback(null, meta, stream);
        }
      };
      mockery.registerMock('../filestore', filestoreMock);

      var attachmentModule = require(this.testEnv.basePath + '/backend/core/attachment');
      attachmentModule.getAttachmentFile(attachmentId, function(err, fileMetaData, fileStream) {
        expect(err).to.not.exist;
        expect(fileMetaData).to.deep.equal(meta);
        expect(fileStream).to.deep.equal(stream);
      });
    });

  });

});
