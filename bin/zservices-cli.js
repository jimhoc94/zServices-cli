#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
var commander_1 = require("commander");
var init_1 = require("./commands/init");
commander_1.program.version("1.0.0").description("zServices-CLI by zDevOps.");
commander_1.program
    .command("init")
    .description("Initialize the SGitHub repository with mainframe components.")
    .requiredOption("-u, --user <username>", "Set the mainframe username")
    .requiredOption("-p, --password <password>", "Set the mainframe password")
    .option("-f, --fileName <string>", "Set the configuration file name", "zInitFile.yaml")
    .action(function (options) { return (0, init_1.handleInitCommand)(options); });
commander_1.program.parse(process.argv);
