const { expect } = require('chai');

describe('the application discovery service controller', function() {
  it('should expose the controller methods', function() {
    const controller = this.helpers.requireBackend('webserver/controllers/application-discovery-service');

    expect(controller).to.have.property('create');
    expect(controller).to.have.property('deleteById');
    expect(controller).to.have.property('getForCurrentUser');
    expect(controller).to.have.property('list');
    expect(controller).to.have.property('listForUser');
    expect(controller).to.have.property('toggleForDomain');
    expect(controller).to.have.property('toggleForPlatform');
    expect(controller).to.have.property('toggleForUser');
    expect(controller).to.have.property('update');
    expect(controller.create).to.be.a('function');
    expect(controller.deleteById).to.be.a('function');
    expect(controller.getForCurrentUser).to.be.a('function');
    expect(controller.list).to.be.a('function');
    expect(controller.listForUser).to.be.a('function');
    expect(controller.toggleForDomain).to.be.a('function');
    expect(controller.toggleForPlatform).to.be.a('function');
    expect(controller.toggleForUser).to.be.a('function');
    expect(controller.update).to.be.a('function');
  });
});
