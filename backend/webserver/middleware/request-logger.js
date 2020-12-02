const logger = require('../../core/logger');

let uniqId = 0;

module.exports = function(req, res, next) {
  req.logging = {
    id: ++uniqId,
    start: Date.now(),
    prev: Date.now(),
    log(message) {
      const logDate = Date.now();
      const fromStart = logDate - this.start;
      const fromPrev = logDate - this.prev;
      const patchMessage = `${message} (${fromPrev}ms/${fromStart}ms) [${this.id}]`;

      this.prev = logDate;
      logger.debug(patchMessage);
    }
  };
  req.logging.log('start');
  next();
};
