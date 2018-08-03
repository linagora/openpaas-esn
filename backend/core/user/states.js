const { USER_ACTION_STATES, USER_ACTIONS } = require('./constants');

module.exports = {
  isEnabled,
  validateActionState,
  validateUserAction
};

function isEnabled(user, action) {
  const state = (user.states || []).find(state => state.name === action);

  return !(state && state.value === USER_ACTION_STATES.disabled);
}

function validateActionState(actionState) {
  return Object.values(USER_ACTION_STATES).indexOf(actionState) > -1;
}

function validateUserAction(userAction) {
  return Object.values(USER_ACTIONS).indexOf(userAction) > -1;
}
