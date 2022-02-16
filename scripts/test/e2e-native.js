const { execSync } = require("child_process");
const findFreePort = require("find-free-port");
const fetch = require("node-fetch");
const { join, resolve } = require("path");
const { cat, cp, ls, mkdir, rm, tempdirm, mv } = require("shelljs");
const { pipeline } = require("stream");
const { promisify } = require("util");
const { createWriteStream } = require("fs");
const { tmpdir } = require("os");
const nodeIp = require("ip");
const { stat } = require("fs/promises");

main().catch(e => {
    console.error(e);
    process.exit(-1);
});

async function main() {
    const mendixVersion = await getMendixVersion();
    const ip = nodeIp.address();
    const ghcr = process.env.CI && process.env.FORKED !== "true" ? "ghcr.io/mendix/widgets-resources/" : "";

    const testArchivePath = await getTestProject("https://github.com/mendix/Native-Mobile-Resources", "main");
    const root = resolve(join(__dirname, "../.."));
    const t = join(root, "tests");
    const tempDir = join(root, "tests/testProject");
    try {
        mkdir("-p", t);
        execSync(`unzip -o ${testArchivePath} -d ${t}`);
        mv(`${t}/Native-Mobile-Resources-main`, tempDir);
        rm("-f", testArchivePath);
    } catch (e) {
        throw new Error("Failed to unzip the test project into testProject", e.message);
    }

    const output = execSync("npx lerna list --json --since origin/master --loglevel silent --scope '*-native'");
    const packages = JSON.parse(output);

    execSync("npx lerna run release --since origin/master --scope '*-native'");

    packages.forEach(({ name, location }) => {
        if (["mobile-resources-native", "nanoflow-actions-native"].includes(name)) {
            // for js actions
            const path = name === "mobile-resources-native" ? "nativemobileresources" : "nanoflowcommons";
            const jsActionsPath = `${tempDir}/javascriptsource/${path}/actions`;
            rm("-rf", jsActionsPath);
            cp("-r", `${location}/dist`, jsActionsPath);
        } else {
            // for widgets
            // this is acceptable if there's one built version.
            cp(`${location}/dist/**/*.mpk`, `${tempDir}/widgets`);
        }
    });

    // When running on CI pull the docker image from Github Container Registry
    if (ghcr) {
        console.log(`Pulling mxbuild docker image from Github Container Registry...`);
        execSync(`docker pull ${ghcr}mxbuild:${mendixVersion}`);
    }

    const existingImages = execSync(`docker image ls -q ${ghcr}mxbuild:${mendixVersion}`).toString().trim();
    const scriptsPath = join(root, "packages/tools/pluggable-widgets-tools/scripts");

    if (!existingImages) {
        console.log(`Creating new mxbuild docker image...`);
        execSync(
            `docker build -f ${join(scriptsPath, "mxbuild.Dockerfile")} ` +
                `--build-arg MENDIX_VERSION=${mendixVersion} ` +
                `-t mxbuild:${mendixVersion} ${scriptsPath}`,
            { stdio: "inherit" }
        );
    }

    if (ghcr) {
        console.log(`Pulling mxruntime docker image from Github Container Registry...`);
        execSync(`docker pull ${ghcr}mxruntime:${mendixVersion}`);
    }

    const existingRuntimeImages = execSync(`docker image ls -q ${ghcr}mxruntime:${mendixVersion}`).toString().trim();
    if (!existingRuntimeImages) {
        console.log(`Creating new runtime docker image...`);
        execSync(
            `docker build -f ${join(scriptsPath, "runtime.Dockerfile")} ` +
                `--build-arg MENDIX_VERSION=${mendixVersion} ` +
                `-t mxruntime:${mendixVersion} ${scriptsPath}`,
            { stdio: "inherit" }
        );
    }

    // Build testProject via mxbuild
    // todo: this is ugly, look for a better solution
    const projectFile = `${tempDir}/NativeComponentsTestProject.mpr`;
    execSync(
        // `docker run -t -v ${root}:/source -v ${tempDir}:/testProject ` +
        `docker run -t -v ${root}:/source ` +
            `--rm ${ghcr}mxbuild:${mendixVersion} bash -c "mx update-widgets --loose-version-check /${projectFile} && mxbuild ` +
            `-o /tmp/automation.mda /source/${tempDir}"`,
        { stdio: "inherit" }
    );
    console.log("Bundle created and all the widgets are updated");

    // Spin up the runtime and run testProject
    const freePort = await findFreePort(3000);
    // todo: runtime docker image may not include metro, meaning we cant get a bundle. CHECK THIS OUT!!!!
    // todo: __dirname is wrong, should be widgets-resources/packages/tools/pluggable-widgets-tools/scripts
    const runtimeContainerId = execSync(
        `docker run -td -v ${root}:/source -v ${scriptsPath}:/shared:ro -w /source -p ${freePort}:8080 ` +
            `-e MENDIX_VERSION=${mendixVersion} --entrypoint /bin/bash ` +
            `--rm ${ghcr}mxruntime:${mendixVersion} /shared/runtime.sh`
    )
        .toString()
        .trim();

    // wait until runtime is alive
    let attempts = 60;
    for (; attempts > 0; --attempts) {
        try {
            const response = await fetch(`http://${ip}:${freePort}`);
            if (response.ok) {
                break;
            }
        } catch (e) {
            console.log(`Could not reach http://${ip}:${freePort}, trying again...`);
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
        if (attempts === 0) {
            throw new Error("Runtime didn't start in time, existing now...");
        }
        const changedPackages = packages.map(package => package.name).join(" ");
        execSync("npm run setup:android");
        execSync(`lerna run test:e2e:local:android --stream --concurrency 1 --scope ${changedPackages}`);
    } catch (e) {
        try {
            execSync(`docker logs ${runtimeContainerId}`, { stdio: "inherit" });
        } catch (_) {}
        console.log(cat("results/runtime.log").toString());
        throw e;
    } finally {
        execSync(`docker rm -f ${runtimeContainerId}`);
    }
}

async function getTestProject(repository, branch) {
    const downloadedArchivePath = join(tmpdir(), `testProject.zip`);

    if (!repository.includes("github.com")) {
        throw new Error("githubUrl is not a valid github repository!");
    }

    try {
        await promisify(pipeline)(
            (
                await fetch(`${repository}/archive/refs/heads/${branch}.zip`)
            ).body,
            createWriteStream(downloadedArchivePath)
        );
        return downloadedArchivePath;
    } catch (e) {
        console.log(`Url is not available :(`);
        rm("-f", downloadedArchivePath);
    }
    throw new Error("Cannot find test project in GitHub repository. Try again later.");
}

async function getMendixVersion() {
    const mendixOptionIndex = process.argv.indexOf("--mx-version");
    const targetMendixVersion = mendixOptionIndex >= 0 ? process.argv[mendixOptionIndex + 1] : undefined;
    let mendixVersion;

    if (process.env.MENDIX_VERSION) {
        return process.env.MENDIX_VERSION;
    }
    try {
        const mendixVersions = await fetch(
            "https://raw.githubusercontent.com/mendix/widgets-resources/master/configs/e2e/mendix-versions.json"
        );

        const mendixVersionsJson = await mendixVersions.json();

        if (targetMendixVersion && targetMendixVersion in mendixVersionsJson) {
            mendixVersion = mendixVersionsJson[targetMendixVersion];
        } else {
            mendixVersion = mendixVersionsJson.latest;
        }
    } catch (e) {
        throw new Error("Couldn't reach github.com. Make sure you are connected to internet.");
    }
    if (!mendixVersion) {
        throw new Error("Couldn't retrieve Mendix version from github.com. Try again later.");
    }

    return mendixVersion;
}
