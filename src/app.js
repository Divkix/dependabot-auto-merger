const { read_config } = require("./lib/check-config");
const { getBotName } = require("./lib/api");
const { dependabotAuthor } = require("./lib/getDependabotDetails");
const { parsePrTitle, matchBumpLevel } = require("./lib/util");
const { log } = require("./lib/log");

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  // to run when a pull request is opened
  app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {
    // load config and get details from payload
    const config = await read_config(context);
    const { pull_request, repository } = context.payload;

    // check if the PR is from dependabot
    const isDependabotPR = pull_request.user.login === dependabotAuthor;
    if (!isDependabotPR) {
      return log(context).info("PR not opened by dependabot[bot]");
    }

    // get details from PR
    const { packageName, oldVersion, newVersion, bumpLevel } =
      parsePrTitle(pull_request);

    // check if the bump level is allowed
    if (!matchBumpLevel(bumpLevel, config)) {
      return log(context).error(
        `PR does not meet bump level settings so not merging!
        ${packageName}: ${oldVersion} -> ${newVersion}
        Current Level: ${config.merge_level}
        Requested Level: ${bumpLevel}`,
      );
    }

    // gather details
    const owner = repository.owner.login;
    const repo = repository.name;

    // try merging the PR
    try {
      await context.octokit.rest.pulls.merge({
        repo: repo,
        owner: owner,
        pull_number: pull_request.number,
        commit_title: config.skip_ci
          ? `[skip ci] ${config.commit_title}`
          : config.commit_title,
        // add [skip ci] to commit title if skip_ci is true in config file
        commit_message: config.commit_message,
        merge_method: config.merge_strategy,
      });
    } catch (e) {
      return log(context).error(e);
    }
  });

  // to run when a pull_request is closed
  app.on("pull_request.closed", async (context) => {
    // get the config
    const { config } = await read_config(context);

    // check if the PR is merged or not
    const { pull_request, repository } = context.payload;

    // if pr is not merged, just closed, then do nothing
    if (!pull_request.merged) {
      return log(context).info("PR not merged, just closed!");
    }

    const iAmMerger =
      (await getBotName(context)) ===
      pull_request.merged_by.login.toLowerCase();
    const owner = repository.owner.login;
    const repo = repository.name;
    const ref = `heads/${pull_request.head.ref}`;

    // check if the PR is merged by the bot
    if (!iAmMerger) {
      return log(context).info("PR not merged by me so not deleting branch!");
    }

    // delete branch if branch is merged, merged by bot and delete_branch is true in config file
    if (config.delete_branch) {
      try {
        await context.octokit.rest.git.deleteRef({ owner, repo, ref });
      } catch (e) {
        return log(context).error(e);
      }
    } else {
      log(context).info("delete_branch set to false in config file");
    }
  });
};
