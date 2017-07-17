var testUtils = {
    hasClass: function(locator, className) {
      return locator
        .getAttribute('class')
        .then(classes => classes.split(' ').some(aClassName => aClassName === className));
    }
};

module.exports = testUtils;
