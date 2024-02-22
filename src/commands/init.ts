// src/commands/init.ts

import { DefinedError } from "ajv";
const Ajv = require("ajv").default;
const fs = require("fs");
const yaml = require("js-yaml");
const addFormats = require("ajv-formats");
const log = require("npmdatelog");
import axios from "axios";

type Configuration = {
  source: string;
  baseDirectory: string;
  logLevel: string;
};

type Transfert = {
  name: string;
  description: string;
  source: string;
  filter: string;
  include: string[];
  exclude: string[];
  destination: string;
  extensionFile: string;
};

type Host = {
  name: string;
  description: string;
  type: string;
  hostname: string;
  port: number;
};

let logLevel: string;
let hostname: string;
let configuration: Configuration;
let transferts: Transfert[];
let hosts: Host[];

// Function to set up logging
export const setupLogging = () => {
  log.enableDate("YYYY-MM-DD HH:mm:ss");
  log.enableProgress();
  // ... Add other log levels and configurations
  log.addLevel("all", -Infinity, { fg: "green" }, "ALL    ");
  log.addLevel("debug", 1000, { fg: "green" }, "DEBUG  ");
  log.addLevel("info", 2000, { fg: "cyan" }, "INFO   ");
  log.addLevel("warning", 3000, { fg: "yellow" }, "WARNING");
  log.addLevel("error", 4000, { fg: "white", bg: "red" }, "ERROR! ");
  log.addLevel(
    "fatal",
    5000,
    { fg: "black", bg: "magenta", bold: true },
    "FATAL!!"
  );
  log.addLevel("off", Infinity);

  log.level = "all";
  log.info("zServices-cli", "zServices-cli by zDevOps");
};

// Function to load JSON schema from file
export const loadJsonSchema = () => {
  log.info("zServices-cli", `loading json schema ./schema.json ...`);
  const schema = require("./schema.json");
  log.info("zServices-cli", `loading json schema, Done : ok`);
  return schema;
};

// Function to load YAML configuration file
export const loadYamlConfig = (fileName: string) => {
  log.info("zServices-cli", `loading configuration file ${fileName} ...`);
  const yamlContent = fs.readFileSync(
    process.cwd() + "/bin/" + `.zservices/zinit/configuration/${fileName}`,
    "utf-8"
  );
  log.info(
    "zServices-cli",
    `loading configuration file ${fileName}, Done : ok`
  );
  return yaml.load(yamlContent);
};

// Function to validate configuration against JSON schema
export const validateConfig = (config: any, schema: any) => {
  log.info("zServices-cli", `Validating configuration file ...`);
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  require("ajv-errors")(ajv);

  const validate = ajv.compile(schema);
  const isValid = validate(config);

  if (isValid) {
    log.info("zServices-cli", `Validating configuration file, Done : ok`);
  } else {
    log.error(
      "zServices-cli",
      `Validating configuration file, Done : invalid !`
    );
    for (const err of validate.errors as DefinedError[]) {
      log.error("zServices-cli", "key: " + err.instancePath);
      log.error("zServices-cli", "errorMessage: " + err.message);
    }
    log.fatal("zServices-cli", `Aborting process with return code(1) !`);
    process.exit(1);
  }
};

// Function to process configuration
export const processConfig = (config: any) => {
  configuration = config.configuration;
  transferts = config.transferts;
  hosts = config.hosts;

  logLevel = configuration.logLevel.toLowerCase();
  log.info(
    "zServices-cli",
    `Log level set to ${logLevel.toUpperCase()} by configuration file`
  );
  log.level = logLevel;
  // ... Add other processing logic
  let source: string = config.configuration.source.toUpperCase();
  let trouve: boolean = false;
  for (const host of hosts) {
    if (host.name === source) {
      trouve = true;
      hostname = host.hostname;
    }
  }
  if (trouve === false) {
    log.error("zServices-cli", `Source ${source} not defined in hosts`);
    log.fatal("zServices-cli", `Aborting process with return code(1) !`);
    process.exit(1);
  }
};

// Function to set up logging
export const processLoop = async (user: string, password: string) => {
  log.info("zServices-cli", `Processing files transferts from ${hostname} ...`);
  for (let transfert in transferts) {
    let name = transferts[transfert].name;
    let PDS = transferts[transfert].source;
    let filter = transferts[transfert].filter;
    let destination = transferts[transfert].destination;
    let extension = transferts[transfert].extensionFile;
    let filesExluded = transferts[transfert].exclude;
    let filesIncluded = transferts[transfert].include;
    let hostname = hosts[transfert].hostname;
    let port = hosts[transfert].port;

    if (filter === undefined) filter = "";
    log.info("zServices-cli", `Transfert ${name}, PDS source : ${PDS}`);

    await axios
      .get(
        "https://" +
          hostname +
          ":" +
          port +
          "/ibmzosmf/api/v1/zosmf/restfiles/ds/" +
          PDS +
          "/member?pattern=" +
          filter,
        {
          auth: {
            username: user,
            password: password,
          },
        }
      )
      .then(function (response) {
        // en cas de réussite de la requête
        let members: string[] = [];

        if (filesIncluded !== undefined) {
          for (let file in filesIncluded) {
            members.push(filesIncluded[file]);
          }
        }
        if (filesExluded !== undefined) {
          let items = response.data.items;
          for (let item in items) {
            members.push(items[item].member);
          }
          for (let exclude in filesExluded) {
            let myIndex = members.indexOf(filesExluded[exclude]);
            if (myIndex !== -1) {
              members.splice(myIndex, 1);
            }
          }
        }

        if (!fs.existsSync(configuration.baseDirectory + destination)) {
          fs.mkdirSync(configuration.baseDirectory + destination, {
            recursive: true,
          });
        }

        for (let member in members) {
          console.log(
            "  Récupération et écriture en local du membre : " + members[member]
          );
          axios
            .get(
              "https://" +
                hostname +
                ":" +
                port +
                "/ibmzosmf/api/v1/zosmf/restfiles/ds/" +
                PDS +
                "(" +
                members[member] +
                ")",
              {
                auth: {
                  username: user,
                  password: password,
                },
              }
            )
            .then(function (response) {
              // en cas de réussite de la requête
              fs.writeFileSync(
                configuration.baseDirectory +
                  "/" +
                  destination +
                  "/" +
                  members[member] +
                  extension,
                response.data
              );
              console.log(" Done");
            })
            .catch(function (error) {
              // en cas d’échec de la requête
              if (error.errno === -3008 && error.code === "ENOTFOUND") {
                log.error(
                  "zServices-cli",
                  `host ${hostname} on port ${port} not reachable`
                );
                log.fatal(
                  "zServices-cli",
                  `Aborting process with return code (1) !`
                );
                process.exit(1);
              }
            })
            .finally(function () {
              // dans tous les cas
            });
        }
      })
      .catch(function (error) {
        // en cas d’échec de la requête
        if (error.errno === -3008 && error.code === "ENOTFOUND") {
          log.error(
            "zServices-cli",
            `host ${hostname} on port ${port} not reachable`
          );
          log.fatal("zServices-cli", `Aborting process with return code (1) !`);
          process.exit(1);
        }
      })
      .finally(function () {
        // dans tous les cas
      });
  }
};

// Main function to handle the init command
export const handleInitCommand = ({
  user,
  password,
  fileName,
}: {
  user: string;
  password: string;
  fileName: string;
}) => {
  setupLogging();
  const schema = loadJsonSchema();
  const config = loadYamlConfig(fileName);
  validateConfig(config, schema);
  processConfig(config);
  processLoop(user, password);
};
