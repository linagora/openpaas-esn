const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const cache = require('../../../../../backend/core/auth/openid-connect/cache');

const CACHE_TTL = 5 * 60 * 1000;

describe('The openid-connect cache', function() {
  let module;
  let clock;
  const cachedValue = { some: 'thing' };
  const cachedId = 'someId';

  beforeEach(function() {
    module = require('../../../../../backend/core/auth/openid-connect/cache');
    clock = sinon.useFakeTimers();
  });

  afterEach(function() {
    clock.restore();
  });

  it('should provide set, get, purge, start and stop functions', function() {
    expect(module.set).to.be.a('function');
    expect(module.get).to.be.a('function');
    expect(module.purge).to.be.a('function');
    expect(module.start).to.be.a('function');
    expect(module.stop).to.be.a('function');
  });

  it('should cache a value', function() {
    module.set(cachedId, cachedValue);

    const val = module.get(cachedId);

    expect(val).to.equal(cachedValue);
  });

  it('should send back the value when ttl is not over', function() {
    module.set(cachedId, cachedValue);
    clock.tick((CACHE_TTL - 1000));

    const value = module.get(cachedId);

    expect(value).to.equal(cachedValue);
  });

  it('should not send back the value when ttl is over', function() {
    module.set(cachedId, cachedValue);
    clock.tick((CACHE_TTL + 1000));

    const value = module.get(cachedId);

    expect(value).to.be.null;
  });

  it('should throw if the cache id is nullish', function() {
    const explode = () => { cache.set('', {some: 'value'}); };

    expect(explode).to.throw();
  });

  describe('purge', function() {
    const cachedId2 = 'id2';
    const cachedValue2 = { some: 'thing2' };

    it('should purge items', function() {
      // insert first item: clock=0
      // insert second item: clock=10000
      // purge: clock=CACHE_TTL-5000
      // so we are between first item (should be expired)
      // and second item
      const secondItemClockEntry = 10000;

      const clockOnPurge = CACHE_TTL - (secondItemClockEntry / 2);

      module.set(cachedId, cachedValue);
      clock.tick(secondItemClockEntry);
      module.set(cachedId2, cachedValue2);
      clock.tick(clockOnPurge);
      module.purge();

      expect(module.get(cachedId)).to.be.null;
      expect(module.get(cachedId2)).to.equal(cachedValue2);
    });
  });
});
