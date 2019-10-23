const { expect } = require('chai');

describe('The ldap people-searcher', () => {
  let resolver;

  beforeEach(function() {
    this.helpers.mock.models({
      User: function() {}
    });
    resolver = this.helpers.requireBackend('core/ldap/people-searcher');
  });

  describe('The denormalizer function', () => {
    it('should resolve with a person with displayName if the source contains first name and last name', function(done) {
      const source = {
        firstname: 'John',
        lastname: 'McDoe'
      };

      resolver.denormalize({ source }).then(person => {
        expect(person.names[0].displayName).to.equal('John McDoe');

        done();
      }).catch(done);
    });
  });
});
