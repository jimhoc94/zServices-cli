// src/commands/init.ts

import { DefinedError } from "ajv";
const Ajv = require("ajv").default;
import * as fs from "fs";
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
  //const schema = require("./schema.json");
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {
      version: {
        const: "1.0.0",
        default: "1.0.0",
        examples: ["1.0.0"],
        errorMessage: "Seule la version de fichier '1.0.0' est supportée !",
      },
      configuration: {
        type: "object",
        properties: {
          source: {
            type: "string",
            default: "SDEV",
            examples: ["SDEV"],
          },
          baseDirectory: {
            type: "string",
            default: "./Compilation",
            examples: ["./Compilation"],
            pattern: "^\\./|(\\./[a-zA-Z0-9_-]+)+$",
          },
          logLevel: {
            enum: ["ALL", "DEBUG", "INFO", "WARNING", "ERROR", "FATAL", "OFF"],
            default: "ERROR",
            examples: ["ERROR"],
          },
        },
        required: ["source", "baseDirectory", "logLevel"],
      },
      transferts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", examples: ["Name of transfert"] },
            description: {
              type: "string",
              examples: ["Description of transfert"],
            },
            source: {
              type: "string",
              minLength: 1,
              maxLength: 44,
              pattern:
                "^[a-zA-Z#$][a-zA-Z0-9#$-]{0,7}([.][a-zA-Z#$][a-zA-Z0-9#$-]{0,7}){0,21}$",
              examples: ["DXXXT.XXX.SOURCES"],
              default: "DXXXT.XXX.SOURCES",
            },
            filter: {
              type: "string",
              minLength: 1,
              maxLength: 9,
              pattern: "[a-zA-Z$#@?*]([a-zA-Z0-9$#@?*]{0,7})",
              examples: ["TOP*"],
              default: '"*"',
            },
            include: {
              type: "array",
              items: {
                type: "string",
                minLength: 1,
                maxLength: 8,
                pattern: "[a-zA-Z$#@]([a-zA-Z0-9$#@]{0,7})",
                examples: ["TOPC0001"],
              },
            },
            exclude: {
              type: "array",
              items: {
                type: "string",
                minLength: 1,
                maxLength: 8,
                pattern: "[a-zA-Z$#@]([a-zA-Z0-9$#@]{0,7})",
                examples: ["TOPC0001"],
              },
            },
            destination: {
              type: "string",
              pattern: "^/|(/[a-zA-Z0-9_-]+)+$",
              examples: ["/SRC", "/CPY", "/JCL"],
              default: "/SRC",
            },
            extensionFile: {
              type: "string",
              pattern: "^\\.[a-zA-Z0-9_-]+",
              examples: [".cbl"],
              default: ".cbl",
            },
          },
          required: [
            "name",
            "description",
            "source",
            "destination",
            "extensionFile",
          ],
        },
        minItems: 1,
      },
      hosts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              examples: ["Name of the host, same as configuration.source"],
            },
            description: {
              type: "string",
              examples: ["Description of the host"],
            },
            type: {
              const: "zos",
              examples: ["zos"],
              default: "zos",
            },
            hostname: {
              type: "string",
              format: "hostname",
              examples: ["sdev.dns21.socgen"],
              default: "sdev.dns21.socgen",
            },
            port: {
              type: "integer",
              minimum: 1,
              maximum: 65535,
              errorMessage: "Le port doit être compris entre 1 et 65535",
              examples: ["12345"],
              default: "12345",
            },
          },
          required: ["name", "description", "type", "hostname", "port"],
        },
        minItems: 1,
      },
    },
    required: ["version", "configuration", "transferts", "hosts"],
  };

  log.info("zServices-cli", `loading json schema, Done : ok`);
  return schema;
};

// Function to load YAML configuration file
export const loadYamlConfig = (fileName: string) => {
  log.info("zServices-cli", `loading configuration file ${fileName} ...`);
  try {
    const yamlContent = fs.readFileSync(
      `.zservices/zinit/configuration/${fileName}`,
      "utf-8"
    );
    log.info(
      "zServices-cli",
      `loading configuration file ${fileName}, Done : ok`
    );
    return yaml.load(yamlContent);
  } catch (error: any) {
    if (error && error.code) {
      log.error("zServices-cli", `File ${fileName} not found !`);
    } else {
      log.debug(
        "zServices-cli",
        `An error occured when trying reading file ${fileName}`
      );
      log.error("zServices-cli", `${error.message}`);
    }
    log.fatal("zServices-cli", `Aborting process with return code(1) !`);
    process.exit(1);
  }
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
    if (filter === undefined) filter = "";
    let destination = transferts[transfert].destination;
    let extension = transferts[transfert].extensionFile;
    let filesExluded = transferts[transfert].exclude;
    let filesIncluded = transferts[transfert].include;
    let hostname = hosts[transfert].hostname;
    let port = hosts[transfert].port;

    let members: string[] = [];

    if (filesIncluded !== undefined) {
      for (let file in filesIncluded) {
        members.push(filesIncluded[file]);
      }
    } else {
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
          // on remplis le tableau members avec le résultat de la requete
          // Si des fichiers à exclure on purge la liste
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

    log.info("zServices-cli", `Transfert ${name}, PDS source : ${PDS}`);

    if (!fs.existsSync(configuration.baseDirectory + destination)) {
      fs.mkdirSync(configuration.baseDirectory + destination, {
        recursive: true,
      });
    }

    for (let member in members) {
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
          log.info(
            "zServices-cli",
            `Récupération du membre ${members[member]}`
          );
          fs.writeFileSync(
            configuration.baseDirectory +
              "/" +
              destination +
              "/" +
              members[member] +
              extension,
            response.data
          );
          log.info(
            "zServices-cli",
            `Ecriture en local du membre ${members[member]}`
          );
        })
        .catch(function (error) {
          // en cas d’échec de la requête
          // à compléter
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
        });
    }
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
