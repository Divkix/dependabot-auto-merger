/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  // to run when a pull request is opened
  app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {
    // get details from payload
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const pull_number = context.payload.pull_request.number;
    const pr_opener = context.payload.sender.login.toLowerCase();

    // if pull_request is opened by dependabot, merge, else do nothing
    // also check if the pull requrest contains the dependencies_label
    if (
      pr_opener === "dependabot[bot]" &&
      context.payload.pull_request.labels.includes("dependencies")
      // dependabot adds "dependencies" label to each PR it creates by default
    ) {
      try {
        // merge the PR
        await context.octokit.rest.pulls.merge({
          repo: repo,
          owner: owner,
          pull_number: pull_number,
          commit_title: "Auto-merge dependabot PR",
          // add [skip ci] to commit title if skip_ci is true in config file
          commit_message: "Auto-merge dependabot PR by @dependabot-auto-merge",
          merge_method: "squash",
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
    if (i_am_merger) {
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
