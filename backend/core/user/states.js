const { USER_ACTION_STATES } = require('./constants');

module.exports = {
  isEnabled,
  validateActionState
};

function isEnabled(user, action) {
  const state = (user.states || []).find(state => state.name === action);

  return !(state && state.value === USER_ACTION_STATES.disabled);
}

function validateActionState(actionState) {
  return Object.values(USER_ACTION_STATES).some(state => state === actionState);
}
