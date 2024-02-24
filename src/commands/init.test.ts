// init.test.ts

import { describe, expect, test, mock } from "@jest/globals";

import {
  setupLogging,
  loadJsonSchema,
  loadYamlConfig,
  validateConfig,
  processConfig,
  handleInitCommand,
} from "./init";

import jest from "jest";

jest.mock("fs");

describe("init command functions", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("setupLogging should configure logging", () => {
    // Mock the log functions for testing purposes
    const logMock = jest.fn();
    const originalLog = log.info;
    log.info = logMock;

    setupLogging();

    // Verify that log.info has been called with the expected arguments
    expect(logMock).toHaveBeenCalledWith(
      "zServices-cli",
      "zServices-cli by zDevOps"
    );

    // Restore the original log function
    log.info = originalLog;
  });

  test("loadJsonSchema should load JSON schema from file", () => {
    // Mock the require function to simulate loading the schema from file
    jest.mock("./schema.json", () => ({ mockSchema: true }));
    const schema = loadJsonSchema();

    // Verify that the schema is loaded correctly
    expect(schema).toEqual({ mockSchema: true });
  });

  test("loadYamlConfig should load YAML configuration from file", () => {
    // Mock the fs module to simulate reading the YAML content
    jest.mock("fs", () => ({
      readFileSync: jest.fn(() => "mockYamlContent"),
    }));

    const fileName = "test.yaml";
    const config = loadYamlConfig(fileName);

    // Verify that the correct file is read and the content is loaded correctly
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining(fileName),
      "utf-8"
    );
    expect(config).toEqual("mockYamlContent");
  });

  test("validateConfig should validate the configuration against the schema", () => {
    // Mock the log functions for testing purposes
    const logMock = jest.fn();
    const originalLog = log.info;
    log.info = logMock;

    // Mock the Ajv functions to simulate validation
    jest.mock("ajv", () => ({
      default: jest.fn(() => ({
        compile: jest.fn(() => () => true),
      })),
    }));

    const config = { mockConfig: true };
    const schema = { mockSchema: true };

    validateConfig(config, schema);

    // Verify that log.info has been called with the expected arguments
    expect(logMock).toHaveBeenCalledWith(
      "zServices-cli",
      "Validating configuration file ..."
    );

    // Restore the original log function
    log.info = originalLog;
  });

  test("processConfig should process the configuration", () => {
    // Mock the log functions for testing purposes
    const logMock = jest.fn();
    const originalLog = log.info;
    log.info = logMock;

    // Mock the log level setting
    const originalLogLevel = log.level;

    const config = { configuration: { logLevel: "info" } };

    processConfig(config);

    // Verify that log.info has been called with the expected arguments
    expect(logMock).toHaveBeenCalledWith(
      "zServices-cli",
      "Log level set to INFO by configuration file"
    );

    // Restore the original log functions and log level
    log.info = originalLog;
    log.level = originalLogLevel;
  });

  test("handleInitCommand should call all necessary functions", () => {
    const user = "testUser";
    const password = "testPassword";
    const fileName = "test.yaml";

    // Mock all functions used in handleInitCommand
    const setupLoggingMock = jest.spyOn(global, "setupLogging");
    const loadJsonSchemaMock = jest.spyOn(global, "loadJsonSchema");
    const loadYamlConfigMock = jest.spyOn(global, "loadYamlConfig");
    const validateConfigMock = jest.spyOn(global, "validateConfig");
    const processConfigMock = jest.spyOn(global, "processConfig");

    handleInitCommand({ user, password, fileName });

    // Verify that all functions have been called with the correct arguments
    expect(setupLoggingMock).toHaveBeenCalled();
    expect(loadJsonSchemaMock).toHaveBeenCalled();
    expect(loadYamlConfigMock).toHaveBeenCalledWith(fileName);
    expect(validateConfigMock).toHaveBeenCalled();
    expect(processConfigMock).toHaveBeenCalled();
  });
});
