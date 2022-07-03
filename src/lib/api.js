// function used to comment on a issue
async function comment(octokit, repo, { number }, body) {
  await octokit.issues.createComment({
    ...repo,
    issue_number: number,
    body,
  });
}
