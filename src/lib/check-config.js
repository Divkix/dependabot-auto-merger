// config file for the app
const config_filename =
  process.env.CONFIG_FILENAME || "dependabot-auto-merger.yml";

// default config file is there isn't one in ".github" directory
const default_config = {
  version: 1, // default version of config file for this bot
  "auto-merge-settings": {
    dependencies_label: "dependencies", // default label for pull requests created by dependabot, should not be changed unless using custom dependabot settings
    merge_level: "minor", // default merge level, can be "minor", "patch" or "major"
    merge_strategy: "squash", // default merge stratery, can be chosen out of "merge", "squash" and "rebase"
    skip_ci: false, // adds "[skip ci]" to commit title
    delete_branch: true, // delete the branch after merging
  },
};

// error message when config file is invalid
invalid_config_message = `Config file is invalid!
Take a look at the example config file [here](https://github.com/divideprojects/dependabot-auto-merger#config-file) to see how to create a valid config file.`;

// function to read config file
async function read_config(context) {
  // read config file
  const config_data = await context.config(config_filename, default_config);
  var valid_config = true;

  // if version is not 1, then throw error
  if (config_data.version !== 1) {
    valid_config = false;
    context.log.error(
      `Config file version ${config_data.version} is not supported!`,
    );
  }

  // read the merge settings
  return valid_config, config_data["auto-merge-settings"];
}
