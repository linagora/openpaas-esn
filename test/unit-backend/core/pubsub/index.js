'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('The pubsub module', function() {
  it('should initialize module pubsubs', function() {
    const asSpy = {init: sinon.spy()};
    const cSpy = {init: sinon.spy()};
    const rSpy = {init: sinon.spy()};
    const nSpy = {init: sinon.spy()};
    const esSpy = {init: sinon.spy()};
    const tSpy = {init: sinon.spy()};
    const uSpy = {init: sinon.spy()};
    const evsSpy = {init: sinon.spy()};

    mockery.registerMock('../activitystreams/pubsub', asSpy);
    mockery.registerMock('../collaboration', {usernotification: cSpy});
    mockery.registerMock('../notification/pubsub', nSpy);
    mockery.registerMock('../elasticsearch/pubsub', esSpy);
    mockery.registerMock('../resource-link/pubsub', rSpy);
    mockery.registerMock('../timeline', tSpy);
    mockery.registerMock('../user', uSpy);
    mockery.registerMock('../eventsourcing', evsSpy);

    const module = this.helpers.requireBackend('core/pubsub');

    module.init();

    expect(asSpy.init).to.have.been.called;
    expect(cSpy.init).to.have.been.called;
    expect(nSpy.init).to.have.been.called;
    expect(esSpy.init).to.have.been.called;
    expect(rSpy.init).to.have.been.called;
    expect(tSpy.init).to.have.been.called;
    expect(uSpy.init).to.have.been.called;
    expect(evsSpy.init).to.have.been.called;
  });
});
