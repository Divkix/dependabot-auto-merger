const { readConfig } = require('./check-config');
const { parsePrTitle } = require('./util');
const log = require('./log');
const { Probot } = require('probot');

// function used to comment on a issue
async function comment(octokit, repo, { number }, body) {
  await octokit.issues.createComment({
    ...repo,
    issue_number: number,
    body,
  });
}

// function to get the name of bot
async function getBotName(context) {
  return `${(await context.octokit.apps.getAuthenticated()).data.slug}[bot]`;
}

/**
 *  function to read config file
 * @param {Object} context - probot context
 * @param {Object} owner - repository owner
 * @param {Object} repo - repository name
 * @param {Object} pullRequest - the reference for the pull request
 */
async function mergePullRequest(context, owner, repo, pullRequest) {
  // read the config
  const config = await readConfig(context);

  // get details from PR
  const { packageName, oldVersion, newVersion } = parsePrTitle(
    pullRequest,
    context,
  );

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
      return log.info(
        context,
        `Merge conflict!
        ${packageName}: ${oldVersion} -> ${newVersion}`,
      );
    }
    return log.error(context, e);
  }
}

/**
 *  function to read config file
 * @param {Object} context - probot context
 * @param {Object} owner - repository owner
 * @param {Object} repo - repository name
 * @param {Object} ref - the reference for the pull request
 * @returns {boolean} - true if the PR is mergeable, false otherwise
 */
async function allCheckRunsCompleted(context, owner, repo, ref) {
  const octokit = context.octokit;
  const checkRuns = (
    await octokit.request(
      'GET /repos/{owner}/{repo}/commits/{ref}/check-runs',
      {
        owner: owner,
        repo: repo,
        ref: ref,
      },
    )
  ).data.check_runs;

  // loop over checkRuns and check if all status are completed
  const checkRunsDoneOrNot = checkRuns.every(
    (checkRun) => checkRun.status === 'completed',
  );

  return checkRunsDoneOrNot;
}

module.exports = {
  comment,
  getBotName,
  mergePullRequest,
  allCheckRunsCompleted,
};
