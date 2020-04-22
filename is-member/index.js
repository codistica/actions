const cp = require('child_process');
cp.execSync(`cd ${__dirname}; yarn install`);

const core = require('@actions/core');
const github = require('@actions/github');

const token = core.getInput("token", { required: true });
const username = core.getInput("username", {required: true});
const org = core.getInput("org", {required: true});
const throwError = JSON.parse(core.getInput('throwError', {required: false})) || false;

const oct = new github.GitHub(token);

oct.orgs.checkMembership({
    org: org,
    username: username
}).then(
    ({ status }) => {
        core.setOutput('result', status === 204 ? '1' : '0');
    },
    (err) => {
        if (throwError) {core.setFailed(err.message)}
        else core.setOutput('result', '0');
    }
);
