const { EsnConfig } = require('../esn-config');

module.exports = {
  filterDomainsByMembersCanBeSearched
};

function filterDomainsByMembersCanBeSearched(domains) {
  return Promise.all(domains.map(domain => new EsnConfig('core', domain._id || domain).get('membersCanBeSearched')))
    .then(memberSearchConfigs => domains.filter((id, index) => memberSearchConfigs[index] !== false));
}
