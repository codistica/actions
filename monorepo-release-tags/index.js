const cp = require('child_process');
const path = require('path');
const fs = require('fs');

cp.execSync(`cd ${__dirname}; yarn install`);

const core = require('@actions/core');
const github = require('@actions/github');

/**
 * @description Generates a Codistica date release tag.
 * @returns {string} - Tag in format YYYY/MM/DD.
 */
const getDateTag = () => {
    const today = new Date();

    /**
     * @description Puts 0 to the left
     * @param {number} num - Input number.
     * @param {number} places - Final length.
     * @returns {string} Number with zeroes on the left.
     */
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    return(
        today.getFullYear().toString() + '/' +
        zeroPad(today.getMonth()+1, 2) + '/' +
        zeroPad(today.getDate(), 2)
    );
};

(async () => {

    const token = core.getInput("token", { required: true });
    const monorepoName = core.getInput("monorepo-name", { required: true });
    const checkOnly = core.getInput("check-only", { required: false }) || false;

    if (!process.env.GITHUB_SHA) {
        core.setFailed('ERROR: No env.GITHUB_SHA present')
    }

    const oct = new github.GitHub(token);

    const packagesPath = path.resolve(process.cwd(), './packages');
    const packageDirnames = fs.readdirSync(packagesPath);
    let tags = [];
    let exposeTags = [];

    packageDirnames.forEach((packageDirname) => {
        const jsonPath = path.resolve(
            packagesPath,
            packageDirname,
            './package.json'
        );
        const json = require(path.relative(__dirname, jsonPath));
        tags.push(`${json.name}@${json.version}`)
    });

    cp.execSync('git fetch --tags');
    const existingTags = cp.execSync('git tag').toString().trim().split('\n');

    if(checkOnly) core.info('Action will not generate a release.');

    for (const tag of tags) {

        // CHECK IF TAG ALREADY EXISTS
        if(existingTags.includes(tag)) continue;

        // PUSH TO EXPOSED OUTPUT
        exposeTags.push(tag);

        if(checkOnly) continue;

        await oct.repos.createRelease({
            ...github.context.repo,
            tag_name: tag,
            target_commitish: process.env.GITHUB_SHA,
            name: `${tag}`,
            draft: false,
        });

        core.info(`Tag created: ${tag}`)
    }

    if (exposeTags.length === 0) {
        core.info('No new tags.');
        exposeTags = '0'
    } else {
        const dateTag = getDateTag();
        if (!existingTags.includes(dateTag)){
            exposeTags.push(dateTag);
            if(!checkOnly) {
                await oct.repos.createRelease({
                    ...github.context.repo,
                    tag_name: dateTag,
                    target_commitish: process.env.GITHUB_SHA,
                    name: `Release of ${dateTag}`,
                    draft: false,
                });
            }
        } else {
            core.info(`Tag ${dateTag} already exists.`)
        }
    }

    core.setOutput('tags', JSON.stringify(exposeTags));
})().catch(
    (err) => {
        core.setFailed(err.message)
    }
);
