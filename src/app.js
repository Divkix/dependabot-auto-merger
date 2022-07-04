const { readConfig } = require('./lib/check-config');
const { getBotName, mergePullRequest } = require('./lib/api');
const { dependabotAuthor } = require('./lib/getDependabotDetails');
const { parsePrTitle, matchBumpLevel } = require('./lib/util');
const log = require('./lib/log');

/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  // to run when a pull request is opened
  app.on(['pull_request.opened', 'pull_request.reopened'], async (context) => {
    // load config and get details from payload
    const config = await readConfig(context);
    const { pull_request: pullRequest, repository } = context.payload;

    // check if the PR is from dependabot
    const isDependabotPR = pullRequest.user.login === dependabotAuthor;
    if (!isDependabotPR) {
      return log.info(context, 'PR not opened by dependabot[bot]');
    }

    // get details from PR
    const { packageName, oldVersion, newVersion, bumpLevel } = parsePrTitle(
      pullRequest,
      context,
    );

    // check if the bump level is allowed
    if (!matchBumpLevel(bumpLevel, config)) {
      return log.error(
        context,
        `PR does not meet bump level settings so not merging!
        ${packageName}: ${oldVersion} -> ${newVersion}
        Current Level: ${config.merge_level}
        Requested Level: ${bumpLevel}`,
      );
    }

    // gather details
    const owner = repository.owner.login;
    const repo = repository.name;

    // merge the pull request
    // return await mergePullRequest(context, { owner, repo, pullRequest });
    // try merging the PR
    try {
      await context.octokit.rest.pulls.merge({
        repo,
        owner,
        pull_number: pullRequest.number,
        commit_title: config.skip_ci
          ? `[skip ci] ${config.commit_title}`
          : config.commit_title,
        // add [skip ci] to commit title if skip_ci is true in config file
        commit_message: config.commit_message,
        merge_method: config.merge_strategy,
      });
    } catch (e) {
      if (e.message.includes('Pull Request is not mergeable')) {
        return log.error(context).error(
          `Merge conflict!
        ${packageName}: ${oldVersion} -> ${newVersion}`,
        );
      }
    }
  });

  // to run when a pull request us edited, specifically to run after dependabot has rebased a PR
  app.on('pull_request.edited', async (context) => {
    // get details from payload
    const { pull_request: pullRequest } = context.payload;

    // check if pr is merged
    if (pullRequest.merged) {
      return log.info(context, 'PR is already merged!');
    }

    if (pullRequest.body.includes('Dependabot is rebasing this PR')) {
      return log.info(context, 'PR is being rebased by dependabot[bot]');
    }

    // gather details
    const owner = repository.owner.login;
    const repo = repository.name;

    // merge the pull request
    // return await mergePullRequest(context, { owner, repo, pullRequest });

    // try merging the PR
    const config = await readConfig(context);
    try {
      await context.octokit.rest.pulls.merge({
        repo,
        owner,
        pull_number: pullRequest.number,
        commit_title: config.skip_ci
          ? `[skip ci] ${config.commit_title}`
          : config.commit_title,
        // add [skip ci] to commit title if skip_ci is true in config file
        commit_message: config.commit_message,
        merge_method: config.merge_strategy,
      });
    } catch (e) {
      if (e.message.includes('Pull Request is not mergeable')) {
        return log.error(context).error(
          `Merge conflict!
        ${packageName}: ${oldVersion} -> ${newVersion}`,
        );
      }
    }
  });

  // to run when a pull_request is closed
  app.on('pull_request.closed', async (context) => {
    // get the config
    const config = await readConfig(context);

    // check if the PR is merged or not
    const { pull_request: pullRequest, repository } = context.payload;

    // if pr is not merged, just closed, then do nothing
    if (!pullRequest.merged) {
      return log.info(context, 'PR not merged, just closed!');
    }

    const iAmMerger =
      (await getBotName(context)) === pullRequest.merged_by.login.toLowerCase();
    const owner = repository.owner.login;
    const repo = repository.name;
    const ref = `heads/${pullRequest.head.ref}`;

    // check if the PR is merged by the bot
    if (!iAmMerger) {
      return log.info(context, 'PR not merged by me so not deleting branch!');
    }

    // delete branch if branch is merged, merged by bot and delete_branch is true in config file
    if (config.delete_branch) {
      try {
        await context.octokit.rest.git.deleteRef({ owner, repo, ref });
      } catch (e) {
        if (e.message.includes('Reference does not exist')) {
          return log.info(context, 'Branch already deleted!');
        }
        return log.error(context, e);
      }
    } else {
      log.info(context, 'delete_branch set to false in config file');
    }

    return;
  });
};
