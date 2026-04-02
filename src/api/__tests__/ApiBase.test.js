import { ApiBase } from "../ApiBase.js";
import ApiClient from "../ApiClient.js";

jest.mock("../ApiClient.js", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("ApiBase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("placeholder", () => {
    expect(true).toBe(true);
  });
});

test("create() calls ApiClient.post with route and body", async () => {
  const api = new ApiBase("tests");

  const body = { message: "hello" };
  const mockResult = { ok: true };

  // @ts-ignore
  ApiClient.post.mockResolvedValue(mockResult);

  const result = await api.create(body);

  expect(ApiClient.post).toHaveBeenCalledTimes(1);
  expect(ApiClient.post).toHaveBeenCalledWith("tests", { body });
  expect(result).toBe(mockResult);
});

test("getAll() calls ApiClient.get with /all route", async () => {
  const api = new ApiBase("tests");
  const mockResult = { ok: true };

  // @ts-ignore
  ApiClient.get.mockResolvedValue(mockResult);

  const result = await api.getAll();

  expect(ApiClient.get).toHaveBeenCalledWith("tests/all");
  expect(result).toBe(mockResult);
});

test("updateById() calls ApiClient.put with pathParams and body", async () => {
  const api = new ApiBase("tests");
  const body = { message: "updated" };
  const mockResult = { ok: true };

  // @ts-ignore
  ApiClient.put.mockResolvedValue(mockResult);

  const result = await api.updateById("123", body);

  expect(ApiClient.put).toHaveBeenCalledWith("tests", {
    pathParams: ["123"],
    body,
  });
  expect(result).toBe(mockResult);
});

test("deleteById() calls ApiClient.delete with pathParams", async () => {
  const api = new ApiBase("tests");
  const mockResult = { ok: true };

  // @ts-ignore
  ApiClient.delete.mockResolvedValue(mockResult);

  const result = await api.deleteById("123");

  expect(ApiClient.delete).toHaveBeenCalledWith("tests", {
    pathParams: ["123"],
  });
  expect(result).toBe(mockResult);
});


