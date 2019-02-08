jest.mock("fs");
const mockedFs = require("fs");
const setup = require("../commands/setup");
describe("Test setup", () => {
  test("success", () => {
    mockedFs.readFile.mockResolvedValueOnce("{\"roots\":[{\"package_info\": \"path\"}]}")
      .mockResolvedValueOnce("{\"rel_root_path\":\"..\",\"packages\":{\"mlsdk\":[{\"version\":\"0.17.0\",\"rel_path\":\"mlsdk/v0.17.0\"}]}}");
    setup({ "_": ["setup"] });
  });
});