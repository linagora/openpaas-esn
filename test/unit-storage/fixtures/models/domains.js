'use strict';

module.exports = function(Domain) {
  var defaultName = 'MyDomain',
      defaultCompany = 'MyAwesomeCompany';

  return {
    newDummyDomain: function(name, company) {
      return new Domain({
        name: name || defaultName,
        company_name: company || defaultCompany
      });
    },
    name: defaultName,
    company: defaultCompany
  };
};
