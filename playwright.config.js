const path = require("node:path");

const venvBin =
  process.platform === "win32"
    ? path.join(__dirname, ".venv", "Scripts")
    : path.join(__dirname, ".venv", "bin");

const e2ePort = Number(process.env.VSF_E2E_PORT || 18765);
const baseURL = `http://127.0.0.1:${e2ePort}`;

const webCommand =
  process.platform === "win32"
    ? `set "PATH=${venvBin};%PATH%" && vsf-profiler web --port ${e2ePort}`
    : `PATH="${venvBin}:$PATH" vsf-profiler web --port ${e2ePort}`;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: {
    timeout: 20_000,
  },
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: webCommand,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
};
