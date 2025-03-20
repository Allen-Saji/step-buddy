import { TestHelpers } from "./utils/helpers";

// This file runs before all tests and sets up the test environment
describe("step-buddy test setup", () => {
  it("initializes the test environment", async () => {
    TestHelpers.initialize();
    console.log("Test environment initialized successfully");
  });
});
