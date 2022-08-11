const log = require('./log');

// config file for the app
const configFilename = 'dependabot-auto-merger.yml';

// default config file is there isn't one in ".github" directory
const defaultConfig = {
  version: 1, // default version of config file for this bot
  auto_merge_settings: {
    merge_level: 'minor', // default merge level, can be "minor", "patch" or "major"
    merge_strategy: 'squash', // default merge stratery, can be chosen out of "merge", "squash" and "rebase"
    skip_ci: false, // adds "[skip ci]" to commit title
    delete_branch: true, // delete the branch after merging
    commit_title: 'Auto-merge dependabot PR', // default commit title
    commit_message: 'Auto-merge dependabot PR by @dependabot-auto-merge', // default commit message
    skip_check_runs: false, // do not skip check runs by default
  },
};

/**
 *  function to read config file
 * @param {Object} context - probot context
 * @returns {Object} - config file auto_merge_settings data
 */
async function readConfig(context) {
  const configData = await context.config(configFilename, defaultConfig); // read config file
  const validConfigArray = [1]; // array of valid config versions

  // if version is not 1, then throw error
  if (!validConfigArray.includes(configData.version)) {
    log.error(
      context,
      `Config file version ${configData.version} is not supported!`,
    );
  }

  // add bot as co-author
  configData.auto_merge_settings.commit_message
    += '\n\nCo-authored-by: dependabot-auto-merger[bot] <108586022+dependabot-auto-merger[bot]@users.noreply.github.com>';

  // read the merge settings
  return configData.auto_merge_settings;
}

module.exports = {
  readConfig,
};
