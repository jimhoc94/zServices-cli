// src/commands/init.ts

const Ajv = require("ajv").default;
const fs = require("fs");
const yaml = require("js-yaml");
const addFormats = require("ajv-formats");
import { DefinedError } from "ajv";

var log = require("npmdatelog");

export const handleInitCommand = ({
  user,
  password,
  fileName,
}: {
  user: string;
  password: string;
  fileName: string;
}) => {
  log.enableDate("YYYY-MM-DD HH:mm:ss"); // If you do not specify a format, the ISO format will be used
  log.enableProgress();
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
  log.info(
    "zServices-cli",
    `Call with parameters; user: ${user}; password: ${password}; fileName: ${fileName}`
  );

  //log.all("zServices-cli", "all");
  //log.debug("zServices-cli", "debug");
  //log.info("zServices-cli", "info");
  //log.warning("zServices-cli", "warning");
  //log.error("zServices-cli", "error");
  //log.fatal("zServices-cli", "fatal");

  //log.addLevel("verbose", 1000, { fg: "cyan", bg: "black" }, "verb");
  //log.addLevel("info", 2000, { fg: "green" });
  //log.addLevel("timing", 2500, { fg: "green", bg: "black" });
  //log.addLevel("http", 3000, { fg: "green", bg: "black" });
  //log.addLevel("notice", 3500, { fg: "cyan", bg: "black" });
  //log.addLevel("warn", 4000, { fg: "black", bg: "yellow" }, "WARN");
  //log.addLevel("error", 5000, { fg: "red", bg: "black" }, "ERR!");
  //log.addLevel("silent", Infinity);

  log.info("zServices-cli", `loading json schema ./schema.json ...`);
  // Charger le schéma JSON
  const schema = require("./schema.json");
  log.info("zServices-cli", `loading json schema, Done : ok`);

  // Charger le contenu du fichier YAML
  log.info("zServices-cli", `loading configuration file ${fileName} ...`);

  const yamlContent = fs.readFileSync(
    process.cwd() + "/bin/" + `.zservices/zinit/configuration/${fileName}`,
    "utf-8"
  );

  log.info(
    "zServices-cli",
    `loading configuration file ${fileName}, Done : ok`
  );

  log.info("zServices-cli", `Validating configuration file ${fileName} ...`);
  // Parser le fichier YAML
  const config = yaml.load(yamlContent);

  // Initialiser Ajv
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  require("ajv-errors")(ajv /*, {singleError: true} */);

  // Compiler le schéma
  const validate = ajv.compile(schema);

  // Valider le fichier JSON
  const isValid = validate(config);

  if (isValid) {
    log.info(
      "zServices-cli",
      `Validating configuration file ${fileName}, Done : ok`
    );
  } else {
    log.error(
      "zServices-cli",
      `Validating configuration file ${fileName}, Done : invalide !`
    );
    for (const err of validate.errors as DefinedError[]) {
      log.error("zServices-cli", "key: " + err.instancePath);
      log.error("zServices-cli", "errorMessage: " + err.message);
    }
    log.fatal("zServices-cli", `Aborting process with return code(1) !`);
    process.exit(1);
  }
  // convert input yaml file to json
  //const config = yaml.load(readUtf8("./zTools/conf/zInitFile.yaml"));
  let logLevel: string = config.configuration.logLevel.toLowerCase();
  log.info(
    "zServices-cli",
    `Log level set to ${logLevel.toUpperCase()} by configuration file`
  );
  log.level = logLevel;
  log.all("zServices-cli", "all");
  log.debug("zServices-cli", "debug");
  log.info("zServices-cli", "info");
  log.warning("zServices-cli", "warning");
  log.error("zServices-cli", "error");
  log.fatal("zServices-cli", "fatal");
  let source = config.configuration.source;
  let typeSource = "";
  let destination = config.configuration.destination;
  let baseDirectory = config.configuration.baseDirectory;
  let clearBefore = config.configuration.clearBefore;
  let hosts = config.hosts;
};
