const cp = require("child_process");
cp.execSync(`cd ${__dirname}; yarn install`);

const core = require("@actions/core");
const github = require("@actions/github");

const token = core.getInput("token", { required: true });
const comment = core.getInput("comment", { required: true });
const issue_number = JSON.parse(core.getInput("number", { required: true }));
const [repo_owner, repo_name] = process.env.GITHUB_REPOSITORY.split("/");

const oct = new github.GitHub(token);

oct.issues.createComment({
    issue_number: issue_number,
    body: comment,
    owner: repo_owner,
    repo: repo_name
}).then(
    ({ status }) => {
        if (status < 200 || status >= 300) {
            core.setFailed(`API response: ${status}`)
        }
    },
    (err) => core.setFailed(err.message)
);
