function log(context) {
  return {
    error: function (message) {
      context.log.error(message);
      throw new error(message);
    },
    info: function (message) {
      context.log.info(message);
    },
    warn: function (message) {
      context.log.warn(message);
    },
  };
}

module.exports = {
  log,
};
