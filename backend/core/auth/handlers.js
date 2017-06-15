const loginHandlers = [];
const logoutHanders = [];

module.exports = {
  getLoginHandlers,
  getLogoutHandlers,
  addLoginHandler,
  addLogoutHandler
};

function getLoginHandlers() {
  return loginHandlers.slice();
}

function getLogoutHandlers() {
  return logoutHanders.slice();
}

function addLoginHandler(handler) {
  loginHandlers.push(handler);
}

function addLogoutHandler(handler) {
  logoutHanders.push(handler);
}
