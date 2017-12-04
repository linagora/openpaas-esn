const q = require('q');
const logger = require('../logger');

const defaultValidator = () => true;

class Checker {
  constructor(resourceType, validator) {
    this.resourceType = resourceType;
    this.validator = validator || defaultValidator;
    this.checkers = [];
  }

  addChecker(checker) {
    if (!checker.name) {
      throw new Error('checker must have a name');
    }

    if (typeof checker.check !== 'function') {
      throw new Error('checker must have a check function');
    }

    this.checkers.push(checker);
    logger.debug(`availability:${this.resourceType}: added "${checker.name}" checker`);
  }

  isAvailable(resourceId) {
    if (!this.validator(resourceId)) {
      return q.resolve({ available: false, message: `Invalid ${this.resourceType}: ${resourceId}` });
    }

    let alreadyInUse = false;
    let message;
    const funcs = this.checkers.map(checker =>
      () => checker.check(resourceId).then(available => {
        if (!available) {
          alreadyInUse = true;
          message = `${this.resourceType} "${resourceId}" is in use, checked by "${checker.name}" checker`;

          return q.reject(new Error(message));
        }
      })
    );

    return funcs.reduce(q.when, q())
      .then(() => ({ available: true }))
      .catch(err => {
        if (alreadyInUse) {
          return q.resolve({ available: false, message });
        }

        return q.reject(err);
      });
  }
}

module.exports = Checker;
