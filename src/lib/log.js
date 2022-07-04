function info(context, message) {
  const logger = context.log;
  logger.info(message);
}

function error(context, message) {
  const logger = context.log;
  logger.error(message);
  throw new Error(message);
}

module.exports = {
  info,
  error,
};
