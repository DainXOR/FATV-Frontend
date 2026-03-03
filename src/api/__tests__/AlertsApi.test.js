jest.mock("../ApiClient.js", () => {
  const mockApiClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockApiClient,
  };
});



import ApiClient from "../ApiClient.js";
import { AlertsApi } from "../AlertsApi.js";


describe("AlertsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updateById calls ApiClient.put with correct route and params", async () => {
    const api = new AlertsApi();

    // @ts-ignore
    ApiClient.put.mockResolvedValue({
      ok: true,
      status: 200,
      data: { id: "1" },
    });

    const body = {
      id_priority: "1",
      id_student: "1",
      id_companion: "1",
      id_vulnerability: "1",
      message: "Test",
    };

    await api.updateById("123", body);

    expect(ApiClient.put).toHaveBeenCalledTimes(1);
    expect(ApiClient.put).toHaveBeenCalledWith(
      "alerts",
      {
        pathParams: ["123"],
        body,
      }
    );
  });

  test("create calls ApiClient.post with correct route", async () => {
    const api = new AlertsApi();

    // @ts-ignore
    ApiClient.post.mockResolvedValue({
      ok: true,
      status: 201,
      data: { id: "1" },
    });

    const body = {
      id_priority: "1",
      id_student: "1",
      id_companion: "1",
      id_vulnerability: "1",
      message: "Test",
    };

    await api.create(body);

    expect(ApiClient.post).toHaveBeenCalledWith(
      "alerts",
      { body }
    );
  });

  test("getAll calls ApiClient.get with /all", async () => {
    const api = new AlertsApi();

    // @ts-ignore
    ApiClient.get.mockResolvedValue({
      ok: true,
      status: 200,
      data: [],
    });

    await api.getAll();

    expect(ApiClient.get).toHaveBeenCalledWith("alerts/all");
  });

  test("getById calls ApiClient.get with id param", async () => {
    const api = new AlertsApi();

    // @ts-ignore
    ApiClient.get.mockResolvedValue({
      ok: true,
      status: 200,
      data: {},
    });

    await api.getById("55");

    expect(ApiClient.get).toHaveBeenCalledWith(
      "alerts",
      { pathParams: ["55"] }
    );
  });

  test("deleteById calls ApiClient.delete correctly", async () => {
    const api = new AlertsApi();

    // @ts-ignore
    ApiClient.delete.mockResolvedValue({
      ok: true,
      status: 200,
      data: {},
    });

    await api.deleteById("77");

    expect(ApiClient.delete).toHaveBeenCalledWith(
      "alerts",
      { pathParams: ["77"] }
    );
  });

});

