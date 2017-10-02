'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('The simple email module', function() {
  let defaultProperties, userModuleMock, emailMock, emailSendMock,
    simpleMail, error, users;

  beforeEach(function() {

    defaultProperties = {
      subject: 'subject',
      text: 'message'
    };

    users = {
      1: {
        _id: '1',
        preferredEmail: '1@op.com'
      },
      2: null
    };

    userModuleMock = {
      get: sinon.spy((userId, cb) => cb(error, users[userId]))
    };

    emailSendMock = sinon.spy((message, callback) => callback(null, 'ok'));

    emailMock = {
      getMailer: () => ({
        send: emailSendMock
      })
    };

    mockery.registerMock('../../user', userModuleMock);
    mockery.registerMock('../index', emailMock);

    simpleMail = this.helpers.requireBackend('core/email/system/simpleMail');

  });

  it('should reject if userId is null', function(done) {
    simpleMail(null, defaultProperties)
      .then(() => {
        done('should reject');
      })
      .catch(err => {
        expect(err).to.exist;
        expect(err.message).to.be.equal('User Id can not be null');
        done();
      });
  });

  it('should reject if properties is incomplete', function(done) {
    defaultProperties.text = null;

    simpleMail(null, defaultProperties)
      .then(() => {
        done('should reject');
      })
      .catch(err => {
        expect(err).to.exist;
        expect(err.message).to.be.equal('subject and text can not be null');
        done();
      });
  });

  it('should reject if user can not be found', function(done) {
    error = null;

    simpleMail(2, defaultProperties)
      .then(() => {
        done('should reject');
      })
      .catch(err => {
        expect(err).to.exist;
        expect(err.message).to.be.equal('User not found');
        done();
      });
  });

  it('should reject if user module return a error', function(done) {
    error = new Error('error');

    simpleMail(2, defaultProperties)
      .then(() => {
        done('should reject');
      })
      .catch(err => {
        expect(err).to.exist;
        expect(err.message).to.be.equal('error');
        done();
      });
  });

  it('it should get the user from user module', function(done) {
    error = null;

    simpleMail(1, defaultProperties).then(() => {
      expect(userModuleMock.get).to.have.been.calledWith(1, sinon.match.func);
      done();
    }).catch(done);
  });

  it('it should send a email', function(done) {
    error = null;

    const properties = {
      subject: 'subject',
      text: 'message',
      to: users[1].preferredEmail
    };

    simpleMail(1, defaultProperties).then(() => {
      expect(emailSendMock).to.have.been.calledWith(properties, sinon.match.func);
      done();
    }).catch(done);
  });
});
