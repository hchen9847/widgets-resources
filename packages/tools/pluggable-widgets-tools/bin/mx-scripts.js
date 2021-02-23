#! /usr/bin/env node
const { spawnSync } = require("child_process");
const { existsSync } = require("fs");
const { delimiter, dirname, join, parse } = require("path");

const [, currentScriptPath, cmd, ...args] = process.argv;
const toolsRoot = currentScriptPath.endsWith("pluggable-widgets-tools")
    ? join(dirname(currentScriptPath), "../@mendix/pluggable-widgets-tools")
    : join(dirname(currentScriptPath), "..");

if (args.indexOf("--subprojectPath") > -1) {
    args.splice(args.indexOf("--subprojectPath"), 2);
}
const realCommand = getRealCommand(cmd, toolsRoot) + " " + args.join(" ");
console.log(`Running MX Widgets Tools script ${cmd}...`);

for (const subCommand of realCommand.split(/&&/g)) {
    const result = spawnSync(subCommand.trim(), [], {
        cwd: process.cwd(),
        env: { ...process.env, PATH: `${process.env.PATH}${delimiter}${findNodeModulesBin()}` },
        shell: true,
        stdio: "inherit"
    });
    if (result.status !== 0) {
        process.exit(result.status);
    }
}

function getRealCommand(cmd, toolsRoot) {
    const eslintCommand = "eslint --config .eslintrc.js --ext .jsx,.js,.ts,.tsx src";
    const prettierCommand = 'prettier --config prettier.config.js "{src,tests}/**/*.{js,jsx,ts,tsx}"';
    const rollupCommand = `rollup --config "${join(toolsRoot, "configs/rollup.config.js")}"`;

    switch (cmd) {
        case "start:web":
        case "start:server":
        case "dev:js":
        case "dev:ts":
            return `${rollupCommand} --watch --configPlatform=web`;
        case "start:native":
        case "start:js:native":
        case "start:ts:native":
        case "dev:js:native":
        case "dev:ts:native":
            return `${rollupCommand} --watch --configPlatform=native`;
        case "build:web":
        case "build:js":
        case "build:ts":
            return `${rollupCommand} --configPlatform=web`;
        case "build:native":
        case "build:js:native":
        case "build:ts:native":
            return `${rollupCommand} --configPlatform=native`;
        case "release:web":
        case "release:js":
        case "release:ts":
            return `${rollupCommand} --configPlatform=web --configProduction`;
        case "release:native":
        case "release:js:native":
        case "release:ts:native":
            return `${rollupCommand} --configPlatform=native --configProduction`;
        case "lint":
            return `${prettierCommand} --check && ${eslintCommand}`;
        case "lint:fix":
            return `${prettierCommand} --write && ${eslintCommand} --fix`;
        case "format":
            return `${prettierCommand} --write`;
        case "test:unit":
        case "test:unit:web":
            return `jest --projects ${join(toolsRoot, "test-config/jest.config.js")}`;
        case "test:unit:native":
            return `jest --projects ${join(toolsRoot, "test-config/jest.native.config.js")}`;
        case "test:e2e":
        case "test:e2e:ts":
        case "test:e2e:js":
            return `wdio ${join(toolsRoot, "test-config/wdio.conf.js")}`;
        case "test:e2e:web:dev":
            return `cross-env DEBUG=true wdio ${join(toolsRoot, "test-config/wdio.conf.js")}`;
        case "test:e2e:web":
            return `node ${join(toolsRoot, "scripts/e2e.js")} $@`;
        case "start:js":
        case "start:ts":
            return "echo This command has no effect, use pluggable-widgets-tools start:web instead!";
        case "validate:copyright":
            return `node ${join(toolsRoot, "scripts/validate-copyright.js")}`;
        case "bump:copyright":
            return `node ${join(toolsRoot, "scripts/bump-copyright-year.js")}`;
        default:
            console.error(`Unknown command passed to MX Widgets Tools script: '${cmd}'`);
            process.exit(1);
    }
}

function findNodeModulesBin() {
    let parentDir = join(__dirname, "../..");
    while (parse(parentDir).root !== parentDir) {
        const candidate = join(parentDir, "node_modules/.bin");
        if (existsSync(candidate)) {
            return candidate;
        }
        parentDir = join(parentDir, "..");
    }
    throw new Error("Cannot find bin folder");
}
