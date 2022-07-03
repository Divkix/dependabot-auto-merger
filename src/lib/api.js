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

module.exports = {
  comment,
  getBotName,
};
