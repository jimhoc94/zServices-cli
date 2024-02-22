#!/usr/bin/env node

// src/index.ts
import { program } from "commander";
import { handleInitCommand } from "./commands/init";

program.version("1.0.0").description("zServices-CLI by zDevOps.");

program
  .command("init")
  .description("Initialize the SGitHub repository with mainframe components.")
  .requiredOption("-u, --user <username>", "Set the mainframe username")
  .requiredOption("-p, --password <password>", "Set the mainframe password")
  .option(
    "-f, --fileName <string>",
    "Set the configuration file name",
    "zInitFile.yaml"
  )
  .action((options) => handleInitCommand(options));

program.parse(process.argv);
