'use strict';

module.exports = denormalize;

function denormalize(domain) {
  return {
    name: domain.name,
    company_name: domain.company_name,
    timestamps: domain.timestamps
  };
}
