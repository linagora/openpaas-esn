'use strict';

module.exports = denormalize;

function denormalize(domain) {
  return {
    id: domain._id,
    name: domain.name,
    company_name: domain.company_name,
    timestamps: domain.timestamps,
    hostnames: domain.hostnames
  };
}
