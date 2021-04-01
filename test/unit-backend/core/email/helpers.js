const { expect } = require('chai');
const mockery = require('mockery');
const sinon = require('sinon');
const path = require('path');

describe('The email helpers', function() {
  let emailHelpersModule;

  describe('The hasAttachments function', function() {
    it('should return true if the \'attachments\' directory exists inside the template directory', function() {
      const templatesDir = '/templates/dir';
      const templateName = 'whatever';
      const joinedPath = '/templates/dir/whatever/attachments';
      const fsIsDirectoryStub = sinon.stub().returns(true);
      const fsStatSyncStub = sinon.stub().returns({ isDirectory: fsIsDirectoryStub });
      const pathJoinStub = sinon.stub().returns(joinedPath);

      mockery.registerMock('fs', { statSync: fsStatSyncStub });
      mockery.registerMock('path', { join: pathJoinStub });

      emailHelpersModule = this.helpers.requireBackend('core/email/helpers');

      const hasAttachments = emailHelpersModule.hasAttachments(templatesDir, templateName);

      expect(pathJoinStub).to.have.been.calledWith(templatesDir, templateName, 'attachments');
      expect(fsStatSyncStub).to.have.been.calledWith(joinedPath);
      expect(fsIsDirectoryStub).to.have.been.calledOnce;
      expect(hasAttachments).to.be.true;
    });

    it('should return false if the \'attachments\' directory does not exist inside the template directory', function() {
      const templatesDir = '/templates/dir';
      const templateName = 'whatever';
      const joinedPath = '/templates/dir/whatever/attachments';
      const fsIsDirectoryStub = sinon.stub().returns(false);
      const fsStatSyncStub = sinon.stub().returns({ isDirectory: fsIsDirectoryStub });
      const pathJoinStub = sinon.stub().returns(joinedPath);

      mockery.registerMock('fs', { statSync: fsStatSyncStub });
      mockery.registerMock('path', { join: pathJoinStub });

      emailHelpersModule = this.helpers.requireBackend('core/email/helpers');

      const hasAttachments = emailHelpersModule.hasAttachments(templatesDir, templateName);

      expect(pathJoinStub).to.have.been.calledWith(templatesDir, templateName, 'attachments');
      expect(fsStatSyncStub).to.have.been.calledWith(joinedPath);
      expect(fsIsDirectoryStub).to.have.been.calledOnce;
      expect(hasAttachments).to.be.false;
    });

    it('should return false if there is an error', function() {
      const templatesDir = '/templates/dir';
      const templateName = 'whatever';
      const joinedPath = '/templates/dir/whatever/attachments';
      const error = new Error('DEAD');
      const fsStatSyncStub = sinon.stub().throws(error);
      const pathJoinStub = sinon.stub().returns(joinedPath);

      mockery.registerMock('fs', { statSync: fsStatSyncStub });
      mockery.registerMock('path', { join: pathJoinStub });

      emailHelpersModule = this.helpers.requireBackend('core/email/helpers');

      const hasAttachments = emailHelpersModule.hasAttachments(templatesDir, templateName);

      expect(pathJoinStub).to.have.been.calledWith(templatesDir, templateName, 'attachments');
      expect(fsStatSyncStub).to.have.been.calledWith(joinedPath);
      expect(hasAttachments).to.be.false;
    });
  });

  describe('The getAttachments function', function() {
    it('should get all the attachments in the \'attachments\' folder if no filter is provided', function() {
      const templatesDir = '/templates/dir';
      const templateName = 'whatever';
      const attachmentsDir = path.join(templatesDir, templateName, 'attachments');
      const filePaths = ['attachment1.png', 'attachment2.png'];
      const fsReaddirSyncStub = sinon.stub().returns(filePaths);

      mockery.registerMock('fs', { readdirSync: fsReaddirSyncStub });

      emailHelpersModule = this.helpers.requireBackend('core/email/helpers');

      const attachments = emailHelpersModule.getAttachments(templatesDir, templateName);

      expect(fsReaddirSyncStub).to.have.been.calledWith(attachmentsDir);
      expect(attachments).to.deep.equal([
        {
          filename: 'attachment1.png',
          path: path.join(attachmentsDir, filePaths[0]),
          cid: 'attachment1',
          contentDisposition: 'inline'
        },
        {
          filename: 'attachment2.png',
          path: path.join(attachmentsDir, filePaths[1]),
          cid: 'attachment2',
          contentDisposition: 'inline'
        }
      ]);
    });

    it('should get the filtered attachments in the \'attachments\' folder if a filter is provided', function() {
      const templatesDir = '/templates/dir';
      const templateName = 'whatever';
      const attachmentsDir = path.join(templatesDir, templateName, 'attachments');
      const filePaths = ['attachment1.png', 'attachment2.png', 'filterThis1.png', 'filterThis2.png'];
      const fsReaddirSyncStub = sinon.stub().returns(filePaths);
      const filter = filePath => !filePath.includes('filterThis');

      mockery.registerMock('fs', { readdirSync: fsReaddirSyncStub });

      emailHelpersModule = this.helpers.requireBackend('core/email/helpers');

      const attachments = emailHelpersModule.getAttachments(templatesDir, templateName, filter);

      expect(fsReaddirSyncStub).to.have.been.calledWith(attachmentsDir);
      expect(attachments).to.deep.equal([
        {
          filename: 'attachment1.png',
          path: path.join(attachmentsDir, filePaths[0]),
          cid: 'attachment1',
          contentDisposition: 'inline'
        },
        {
          filename: 'attachment2.png',
          path: path.join(attachmentsDir, filePaths[1]),
          cid: 'attachment2',
          contentDisposition: 'inline'
        }
      ]);
    });
  });

  describe('The getTemplatesDir function', function() {
    it('should return the default templates directory if \'template\' is a string', function() {
      const templateName = 'whatever';
      const defaultTemplatesDir = '/default/templates/dir';

      emailHelpersModule = this.helpers.requireBackend('core/email/helpers');

      const templateDir = emailHelpersModule.getTemplatesDir(templateName, defaultTemplatesDir);

      expect(templateDir).to.equal(defaultTemplatesDir);
    });

    it('should return the default templates directory if \'template\' is an object without the \'path\' property', function() {
      const template = { name: 'whatever' };
      const defaultTemplatesDir = '/default/templates/dir';

      emailHelpersModule = this.helpers.requireBackend('core/email/helpers');

      const templateDir = emailHelpersModule.getTemplatesDir(template, defaultTemplatesDir);

      expect(templateDir).to.equal(defaultTemplatesDir);
    });

    it('should return the template path if \'template\' is an object with the \'path\' property', function() {
      const template = { name: 'whatever', path: '/path/to/template' };
      const defaultTemplatesDir = '/default/templates/dir';

      emailHelpersModule = this.helpers.requireBackend('core/email/helpers');

      const templateDir = emailHelpersModule.getTemplatesDir(template, defaultTemplatesDir);

      expect(templateDir).to.equal(template.path);
    });
  });
});
