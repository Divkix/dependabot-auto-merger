// Git Data API use case example
// See: https://developer.github.com/v3/git/ to learn more

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  // config file for the app
  const config_filename =
    process.env.CONFIG_FILENAME || "dependabot-auto-merger.yml";
  const default_config = {
    version: 1,
    "auto-merge-settings": {
      merge_level: "minor",
      merge_strategy: "squash",
      skip_ci: false,
      delete_branch: true,
    },
  };

  // to run when a pull request is opened
  app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {
    // read config file
    const read_config = await context.config(config_filename, default_config);

    // if version is not 1, then throw error
    if (read_config.version !== 1) {
      throw new Error(
        `Config file version ${read_config.version} is not supported`,
      );
    }

    // read the merge settings
    const config = read_config["auto-merge-settings"];

    // get name of pr sender
    const pr_opener = context.payload.sender.login.toLowerCase();

    // if pull_request is opened by dependabot, merge, else do nothing
    if (pr_opener === "dependabot[bot]") {
      // get details from payload
      const owner = context.payload.repository.owner.login;
      const repo = context.payload.repository.name;
      const pull_number = context.payload.pull_request.number;

      try {
        // merge the PR
        await context.octokit.rest.pulls.merge({
          repo: repo,
          owner: owner,
          pull_number: pull_number,
          commit_title: config.skip_ci
            ? "[skip ci] Auto-merge dependabot PR"
            : "Auto-merge dependabot PR",
          // add [skip ci] to commit title if skip_ci is true in config file
          commit_message: "Auto-merge dependabot PR by @dependabot-auto-merge",
          merge_method: config.merge_strategy,
        });
      } catch (e) {
        context.log.error(e);
      }
    } else {
      // log that PR is not opened by bot
      return context.log.info("PR not opened by dependabot[bot]");
    }
  });

  // to run when a pull_request is closed
  app.on("pull_request.closed", async (context) => {
    // read config file
    const read_config = await context.config(config_filename, default_config);

    // if version is not 1, then throw error
    if (read_config.version !== 1) {
      throw new Error(
        `Config file version ${read_config.version} is not supported`,
      );
    }

    // read the merge settings
    const config = read_config["auto-merge-settings"];

    // check if the PR is merged or not
    const isMerged = context.payload.pull_request.merged;

    // if pr is not merged, just closed, then do nothing
    if (!isMerged) {
      context.log.info("PR not merged, just closed!");
      return;
    }

    // get bot name
    const app_name =
      (await context.octokit.apps.getAuthenticated()).data.slug + "[bot]";

    // get name of pr merger
    const pr_merger =
      context.payload.pull_request.merged_by.login.toLowerCase();

    // boolean to check if the PR is merged by the bot
    const i_am_merger = app_name === pr_merger;

    // get details from payload
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const branchName = context.payload.pull_request.head.ref;
    const ref = `heads/${branchName}`;

    // delete branch if branch is merged, merged by bot and delete_branch is true in config file
    if (i_am_merger && config.delete_branch) {
      try {
        await context.octokit.rest.git.deleteRef({ owner, repo, ref });
      } catch (e) {
        context.log.error(e);
      }
    } else {
      context.log.info("PR not merged by bot so not deleting.");
    }
  });
};
