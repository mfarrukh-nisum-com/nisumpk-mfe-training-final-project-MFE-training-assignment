module.exports = {
  projects: [
    {
      displayName: "libs-and-apps",
      testEnvironment: "jsdom",
      preset: "ts-jest",
      setupFilesAfterEach: [],
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      moduleNameMapper: {
        "^@final-mfe/shared-types$": "<rootDir>/libs/shared-types/src/index.ts",
        "^@final-mfe/shared-ui$": "<rootDir>/libs/shared-ui/src/index.ts",
        "^@final-mfe/state$": "<rootDir>/libs/state/src/index.ts",
        "^@final-mfe/events$": "<rootDir>/libs/events/src/index.ts",
        "^@final-mfe/utilities$": "<rootDir>/libs/utilities/src/index.ts",
      },
      testPathIgnorePatterns: ["/node_modules/", "/dist/", "/apps/api/"],
    },
    {
      displayName: "api",
      testEnvironment: "node",
      preset: "ts-jest",
      rootDir: "apps/api",
      moduleNameMapper: {
        "^@final-mfe/shared-types$": "<rootDir>/../../libs/shared-types/src/index.ts",
      },
    },
  ],
};
