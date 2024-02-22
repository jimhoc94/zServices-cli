"use strict";
// src/commands/init.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInitCommand = void 0;
var Ajv = require("ajv").default;
var fs = require("fs");
var yaml = require("js-yaml");
var addFormats = require("ajv-formats");
var log = require("npmdatelog");
var handleInitCommand = function (_a) {
    var user = _a.user, password = _a.password, fileName = _a.fileName;
    log.enableDate("YYYY-MM-DD HH:mm:ss"); // If you do not specify a format, the ISO format will be used
    log.enableProgress();
    log.addLevel("all", -Infinity, { fg: "green" }, "ALL    ");
    log.addLevel("debug", 1000, { fg: "green" }, "DEBUG  ");
    log.addLevel("info", 2000, { fg: "cyan" }, "INFO   ");
    log.addLevel("warning", 3000, { fg: "yellow" }, "WARNING");
    log.addLevel("error", 4000, { fg: "white", bg: "red" }, "ERROR! ");
    log.addLevel("fatal", 5000, { fg: "black", bg: "magenta", bold: true }, "FATAL!!");
    log.addLevel("off", Infinity);
    log.level = "all";
    log.info("zServices-cli", "zServices-cli by zDevOps");
    log.info("zServices-cli", "Call with parameters; user: ".concat(user, "; password: ").concat(password, "; fileName: ").concat(fileName));
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
    log.info("zServices-cli", "loading json schema ./schema.json ...");
    // Charger le schéma JSON
    var schema = require("./schema.json");
    log.info("zServices-cli", "loading json schema, Done : ok");
    // Charger le contenu du fichier YAML
    log.info("zServices-cli", "loading configuration file ".concat(fileName, " ..."));
    var yamlContent = fs.readFileSync(process.cwd() + "/bin/" + ".zservices/zinit/configuration/".concat(fileName), "utf-8");
    log.info("zServices-cli", "loading configuration file ".concat(fileName, ", Done : ok"));
    log.info("zServices-cli", "Validating configuration file ".concat(fileName, " ..."));
    // Parser le fichier YAML
    var config = yaml.load(yamlContent);
    // Initialiser Ajv
    var ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    require("ajv-errors")(ajv /*, {singleError: true} */);
    // Compiler le schéma
    var validate = ajv.compile(schema);
    // Valider le fichier JSON
    var isValid = validate(config);
    if (isValid) {
        log.info("zServices-cli", "Validating configuration file ".concat(fileName, ", Done : ok"));
    }
    else {
        log.error("zServices-cli", "Validating configuration file ".concat(fileName, ", Done : invalide !"));
        for (var _i = 0, _b = validate.errors; _i < _b.length; _i++) {
            var err = _b[_i];
            log.error("zServices-cli", "key: " + err.instancePath);
            log.error("zServices-cli", "errorMessage: " + err.message);
        }
        log.fatal("zServices-cli", "Aborting process with return code(1) !");
        process.exit(1);
    }
    // convert input yaml file to json
    //const config = yaml.load(readUtf8("./zTools/conf/zInitFile.yaml"));
    var logLevel = config.configuration.logLevel.toLowerCase();
    log.info("zServices-cli", "Log level set to ".concat(logLevel.toUpperCase(), " by configuration file"));
    log.level = logLevel;
    log.all("zServices-cli", "all");
    log.debug("zServices-cli", "debug");
    log.info("zServices-cli", "info");
    log.warning("zServices-cli", "warning");
    log.error("zServices-cli", "error");
    log.fatal("zServices-cli", "fatal");
    var source = config.configuration.source;
    var typeSource = "";
    var destination = config.configuration.destination;
    var baseDirectory = config.configuration.baseDirectory;
    var clearBefore = config.configuration.clearBefore;
    var hosts = config.hosts;
};
exports.handleInitCommand = handleInitCommand;
