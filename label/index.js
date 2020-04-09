const cp = require('child_process');
cp.execSync(`cd ${__dirname}; yarn install`);

const core = require('@actions/core');
const github = require('@actions/github');

const token = core.getInput("token", { required: true });
const labels = JSON.parse(core.getInput("labels", { required: true }));
const issue_number = JSON.parse(core.getInput("number", { required: true }));
const [repo_owner, repo_name] = process.env.GITHUB_REPOSITORY.split("/");

const oct = new github.GitHub(token);

oct.issues.addLabels({
    labels: labels,
    issue_number: issue_number,
    owner: repo_owner,
    repo: repo_name
}).then(
    ({ status }) => {
        if (status < 200 || status >= 300) {
            core.setFailed(`API Response: ${status}`)
        }
    },
    (err) => core.setFailed(err.message)
);
