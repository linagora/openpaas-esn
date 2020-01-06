module.exports = {
 denormalize
};

function denormalize({ _id, name, description, type, data } = {}) {
    return { _id, name, description, type, data };
}
