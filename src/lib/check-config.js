// config file for the app
const config_filename =
  process.env.CONFIG_FILENAME || "dependabot-auto-merger.yml";

// default config file is there isn't one in ".github" directory
const default_config = {
  version: 1, // default version of config file for this bot
  auto_merge_settings: {
    merge_level: "minor", // default merge level, can be "minor", "patch" or "major"
    merge_strategy: "squash", // default merge stratery, can be chosen out of "merge", "squash" and "rebase"
    skip_ci: false, // adds "[skip ci]" to commit title
    delete_branch: true, // delete the branch after merging
  },
};

/**
 *  function to read config file
 * @param {Object} context - probot context
 * @returns {Promise<Object>} - config file auto_merge_settings data
 */
async function read_config(context) {
  const config_data = await context.config(config_filename, default_config); // read config file
  const valid_config_array = [1, 2]; // array of valid config versions

  // if version is not 1, then throw error
  if (!valid_config_array.includes(config_data.version)) {
    context.log.error(
      `Config file version ${config_data.version} is not supported!`,
    );
  }

  // read the merge settings
  return config_data.auto_merge_settings;
}

module.exports = {
  read_config,
};
