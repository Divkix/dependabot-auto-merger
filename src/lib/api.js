const { readConfig } = require('./check-config');
const { parsePrTitle } = require('./util');
const log = require('./log');

// function used to comment on a issue
async function comment(octokit, repo, { number }, body) {
  await octokit.issues.createComment({
    ...repo,
    issue_number: number,
    body,
  });
}

async function getBotName(context) {
  return `${(await context.octokit.apps.getAuthenticated()).data.slug}[bot]`;
}

async function mergePullRequest(context, { owner, repo, pullRequest }) {
  // read the config
  const { config } = await readConfig(context);

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
      return log.error(context).error(
        `Merge conflict!
        ${packageName}: ${oldVersion} -> ${newVersion}`,
      );
    }
  }
}

module.exports = {
  comment,
  getBotName,
  mergePullRequest,
};
