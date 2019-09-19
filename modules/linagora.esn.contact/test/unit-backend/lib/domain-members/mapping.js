const { expect } = require('chai');
const sinon = require('sinon');

describe('The domain member address book mapping module', function() {
  let getModule, coreUserModuleMock;

  beforeEach(function() {
    coreUserModuleMock = {
      getDisplayName: () => {}
    };

    this.moduleHelpers.addDep('user', coreUserModuleMock);

    getModule = () => require('../../../../backend/lib/domain-members/mapping')(this.moduleHelpers.dependencies);
  });

  it('should set vCard version is 4.0', function() {
    const convertedVCard = getModule().toVCard({});

    expect(convertedVCard.getFirstPropertyValue('version')).to.equal('4.0');
  });

  it('should set "uid" property of vCard is user ID', function() {
    const userId = 'userId';
    const convertedVCard = getModule().toVCard({ _id: userId });

    expect(convertedVCard.getFirstPropertyValue('uid')).to.equal(userId);
  });

  it('should set "fn" property of vCard is display name of the user', function() {
    const displayName = 'foo';
    const user = { _id: '123' };

    coreUserModuleMock.getDisplayName = sinon.stub().returns(displayName);

    const convertedVCard = getModule().toVCard(user);

    expect(convertedVCard.getFirstPropertyValue('fn')).to.equal(displayName);
    expect(coreUserModuleMock.getDisplayName).to.have.been.calledWith(user);
  });

  it('should set "n" property of vCard if user has first name', function() {
    const user = { firstName: 'foo' };
    const convertedVCard = getModule().toVCard(user);

    expect(convertedVCard.getFirstPropertyValue('n')).to.deep.equal(['foo']);
  });

  it('should set "n" property of vCard if user has last name', function() {
    const user = { lastName: 'bar' };
    const convertedVCard = getModule().toVCard(user);

    expect(convertedVCard.getFirstPropertyValue('n')).to.deep.equal(['bar']);
  });

  it('should set "n" property of vCard if user has first name and last name', function() {
    const user = { firstName: 'foo', lastName: 'bar' };
    const convertedVCard = getModule().toVCard(user);

    expect(convertedVCard.getFirstPropertyValue('n')).to.deep.equal(['bar', 'foo']);
  });

  it('should set "tel" property of vCard if user has main_phone', function() {
    const user = { main_phone: '+84 12345678' };
    const convertedVCard = getModule().toVCard(user);
    const telProperty = convertedVCard.getFirstProperty('tel');

    expect(telProperty.getValues()).to.deep.equal(['+84 12345678']);
    expect(telProperty.getParameter('type')).to.deep.equal(['work']);
  });

  it('should set "email" properties of vCard if user has emails', function() {
    const user = { emails: ['foo@lng.org', 'bar@lng.org'] };

    const convertedVCard = getModule().toVCard(user);
    const emailProperties = convertedVCard.getAllProperties('email');

    expect(emailProperties[0].getValues()).to.deep.equal(['foo@lng.org']);
    expect(emailProperties[0].getParameter('type')).to.deep.equal(['work']);
    expect(emailProperties[1].getValues()).to.deep.equal(['bar@lng.org']);
    expect(emailProperties[1].getParameter('type')).to.deep.equal(['work']);
  });

  it('should set "org" property of vCard if user has service', function() {
    const user = { service: 'Linagora' };
    const convertedVCard = getModule().toVCard(user);

    expect(convertedVCard.getFirstPropertyValue('org')).to.equal('Linagora');
  });

  it('should set "role" property of vCard if user has job_title', function() {
    const user = { job_title: 'Sofware Engineer' };
    const convertedVCard = getModule().toVCard(user);

    expect(convertedVCard.getFirstPropertyValue('role')).to.equal('Sofware Engineer');
  });

  it('should set "adr" property of vCard if user has building_location', function() {
    const location = 'No 1, Thai Ha Street, Dong Da, Hanoi';
    const user = { building_location: location };
    const convertedVCard = getModule().toVCard(user);
    const adrProperty = convertedVCard.getFirstProperty('adr');

    expect(adrProperty.getFirstValue()).to.equal(location);
    expect(adrProperty.getParameter('type')).to.deep.equal(['work']);
  });

  it('should set "adr" property of vCard if user has office_location', function() {
    const location = 'Floor 4, Viettower Building';
    const user = { office_location: location };
    const convertedVCard = getModule().toVCard(user);
    const adrProperty = convertedVCard.getFirstProperty('adr');

    expect(adrProperty.getFirstValue()).to.equal(location);
    expect(adrProperty.getParameter('type')).to.deep.equal(['work']);
  });

  it('should set "photo" property of vCard if there is a esnBaseUrl', function() {
    const user = { _id: '123' };
    const esnBaseUrl = 'https://open-paas.org';
    const convertedVCard = getModule().toVCard(user, esnBaseUrl);

    expect(convertedVCard.getFirstPropertyValue('photo')).to.equal(`${esnBaseUrl}/api/users/${user._id}/profile/avatar`);
  });

  it('should set "categories" property of vCard', function() {
    const convertedVCard = getModule().toVCard({});

    expect(convertedVCard.getFirstPropertyValue('categories')).to.equal('Organization members');
  });
});
