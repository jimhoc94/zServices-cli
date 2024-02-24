"use strict";
// src/commands/init.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInitCommand = exports.processLoop = exports.processConfig = exports.validateConfig = exports.loadYamlConfig = exports.loadJsonSchema = exports.setupLogging = void 0;
var Ajv = require("ajv").default;
var fs = require("fs");
var yaml = require("js-yaml");
var addFormats = require("ajv-formats");
var log = require("npmdatelog");
var axios_1 = require("axios");
var logLevel;
var hostname;
var configuration;
var transferts;
var hosts;
// Function to set up logging
var setupLogging = function () {
    log.enableDate("YYYY-MM-DD HH:mm:ss");
    log.enableProgress();
    // ... Add other log levels and configurations
    log.addLevel("all", -Infinity, { fg: "green" }, "ALL    ");
    log.addLevel("debug", 1000, { fg: "green" }, "DEBUG  ");
    log.addLevel("info", 2000, { fg: "cyan" }, "INFO   ");
    log.addLevel("warning", 3000, { fg: "yellow" }, "WARNING");
    log.addLevel("error", 4000, { fg: "white", bg: "red" }, "ERROR! ");
    log.addLevel("fatal", 5000, { fg: "black", bg: "magenta", bold: true }, "FATAL!!");
    log.addLevel("off", Infinity);
    log.level = "all";
    log.info("zServices-cli", "zServices-cli by zDevOps");
};
exports.setupLogging = setupLogging;
// Function to load JSON schema from file
var loadJsonSchema = function () {
    log.info("zServices-cli", "loading json schema ./schema.json ...");
    //const schema = require("./schema.json");
    var schema = {
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
                            pattern: "^[a-zA-Z#$][a-zA-Z0-9#$-]{0,7}([.][a-zA-Z#$][a-zA-Z0-9#$-]{0,7}){0,21}$",
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
    log.info("zServices-cli", "loading json schema, Done : ok");
    return schema;
};
exports.loadJsonSchema = loadJsonSchema;
// Function to load YAML configuration file
var loadYamlConfig = function (fileName) {
    log.info("zServices-cli", "loading configuration file ".concat(fileName, " ..."));
    try {
        var yamlContent = fs.readFileSync(".zservices/zinit/configuration/".concat(fileName), "utf-8");
        log.info("zServices-cli", "loading configuration file ".concat(fileName, ", Done : ok"));
        return yaml.load(yamlContent);
    }
    catch (error) {
        if (error && error.code) {
            log.error("zServices-cli", "File ".concat(fileName, " not found !"));
        }
        else {
            log.error("zServices-cli", "An error occured when trying reading file ".concat(fileName));
        }
        log.fatal("zServices-cli", "Aborting process with return code(1) !");
        process.exit(1);
    }
};
exports.loadYamlConfig = loadYamlConfig;
// Function to validate configuration against JSON schema
var validateConfig = function (config, schema) {
    log.info("zServices-cli", "Validating configuration file ...");
    var ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    require("ajv-errors")(ajv);
    var validate = ajv.compile(schema);
    var isValid = validate(config);
    if (isValid) {
        log.info("zServices-cli", "Validating configuration file, Done : ok");
    }
    else {
        log.error("zServices-cli", "Validating configuration file, Done : invalid !");
        for (var _i = 0, _a = validate.errors; _i < _a.length; _i++) {
            var err = _a[_i];
            log.error("zServices-cli", "key: " + err.instancePath);
            log.error("zServices-cli", "errorMessage: " + err.message);
        }
        log.fatal("zServices-cli", "Aborting process with return code(1) !");
        process.exit(1);
    }
};
exports.validateConfig = validateConfig;
// Function to process configuration
var processConfig = function (config) {
    configuration = config.configuration;
    transferts = config.transferts;
    hosts = config.hosts;
    logLevel = configuration.logLevel.toLowerCase();
    log.info("zServices-cli", "Log level set to ".concat(logLevel.toUpperCase(), " by configuration file"));
    log.level = logLevel;
    // ... Add other processing logic
    var source = config.configuration.source.toUpperCase();
    var trouve = false;
    for (var _i = 0, hosts_1 = hosts; _i < hosts_1.length; _i++) {
        var host = hosts_1[_i];
        if (host.name === source) {
            trouve = true;
            hostname = host.hostname;
        }
    }
    if (trouve === false) {
        log.error("zServices-cli", "Source ".concat(source, " not defined in hosts"));
        log.fatal("zServices-cli", "Aborting process with return code(1) !");
        process.exit(1);
    }
};
exports.processConfig = processConfig;
// Function to set up logging
var processLoop = function (user, password) { return __awaiter(void 0, void 0, void 0, function () {
    var _loop_1, _a, _b, _c, _i, transfert;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                log.info("zServices-cli", "Processing files transferts from ".concat(hostname, " ..."));
                _loop_1 = function (transfert) {
                    var name_1, PDS, filter, destination, extension, filesExluded, filesIncluded, hostname_1, port;
                    return __generator(this, function (_e) {
                        switch (_e.label) {
                            case 0:
                                name_1 = transferts[transfert].name;
                                PDS = transferts[transfert].source;
                                filter = transferts[transfert].filter;
                                destination = transferts[transfert].destination;
                                extension = transferts[transfert].extensionFile;
                                filesExluded = transferts[transfert].exclude;
                                filesIncluded = transferts[transfert].include;
                                hostname_1 = hosts[transfert].hostname;
                                port = hosts[transfert].port;
                                if (filter === undefined)
                                    filter = "";
                                log.info("zServices-cli", "Transfert ".concat(name_1, ", PDS source : ").concat(PDS));
                                return [4 /*yield*/, axios_1.default
                                        .get("https://" +
                                        hostname_1 +
                                        ":" +
                                        port +
                                        "/ibmzosmf/api/v1/zosmf/restfiles/ds/" +
                                        PDS +
                                        "/member?pattern=" +
                                        filter, {
                                        auth: {
                                            username: user,
                                            password: password,
                                        },
                                    })
                                        .then(function (response) {
                                        // en cas de réussite de la requête
                                        var members = [];
                                        if (filesIncluded !== undefined) {
                                            for (var file in filesIncluded) {
                                                members.push(filesIncluded[file]);
                                            }
                                        }
                                        if (filesExluded !== undefined) {
                                            var items = response.data.items;
                                            for (var item in items) {
                                                members.push(items[item].member);
                                            }
                                            for (var exclude in filesExluded) {
                                                var myIndex = members.indexOf(filesExluded[exclude]);
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
                                        var _loop_2 = function (member) {
                                            console.log("  Récupération et écriture en local du membre : " + members[member]);
                                            axios_1.default
                                                .get("https://" +
                                                hostname_1 +
                                                ":" +
                                                port +
                                                "/ibmzosmf/api/v1/zosmf/restfiles/ds/" +
                                                PDS +
                                                "(" +
                                                members[member] +
                                                ")", {
                                                auth: {
                                                    username: user,
                                                    password: password,
                                                },
                                            })
                                                .then(function (response) {
                                                // en cas de réussite de la requête
                                                fs.writeFileSync(configuration.baseDirectory +
                                                    "/" +
                                                    destination +
                                                    "/" +
                                                    members[member] +
                                                    extension, response.data);
                                                console.log(" Done");
                                            })
                                                .catch(function (error) {
                                                // en cas d’échec de la requête
                                                if (error.errno === -3008 && error.code === "ENOTFOUND") {
                                                    log.error("zServices-cli", "host ".concat(hostname_1, " on port ").concat(port, " not reachable"));
                                                    log.fatal("zServices-cli", "Aborting process with return code (1) !");
                                                    process.exit(1);
                                                }
                                            })
                                                .finally(function () {
                                                // dans tous les cas
                                            });
                                        };
                                        for (var member in members) {
                                            _loop_2(member);
                                        }
                                    })
                                        .catch(function (error) {
                                        // en cas d’échec de la requête
                                        if (error.errno === -3008 && error.code === "ENOTFOUND") {
                                            log.error("zServices-cli", "host ".concat(hostname_1, " on port ").concat(port, " not reachable"));
                                            log.fatal("zServices-cli", "Aborting process with return code (1) !");
                                            process.exit(1);
                                        }
                                    })
                                        .finally(function () {
                                        // dans tous les cas
                                    })];
                            case 1:
                                _e.sent();
                                return [2 /*return*/];
                        }
                    });
                };
                _a = transferts;
                _b = [];
                for (_c in _a)
                    _b.push(_c);
                _i = 0;
                _d.label = 1;
            case 1:
                if (!(_i < _b.length)) return [3 /*break*/, 4];
                _c = _b[_i];
                if (!(_c in _a)) return [3 /*break*/, 3];
                transfert = _c;
                return [5 /*yield**/, _loop_1(transfert)];
            case 2:
                _d.sent();
                _d.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.processLoop = processLoop;
// Main function to handle the init command
var handleInitCommand = function (_a) {
    var user = _a.user, password = _a.password, fileName = _a.fileName;
    (0, exports.setupLogging)();
    var schema = (0, exports.loadJsonSchema)();
    var config = (0, exports.loadYamlConfig)(fileName);
    (0, exports.validateConfig)(config, schema);
    (0, exports.processConfig)(config);
    (0, exports.processLoop)(user, password);
};
exports.handleInitCommand = handleInitCommand;
