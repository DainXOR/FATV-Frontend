import { expectErr } from "../../utils/types.js";

const mockAxiosInstance = {
  request: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),                 // used by #checkUrl and #fetchApiVersion
    create: jest.fn(() => mockAxiosInstance),
    isAxiosError: jest.fn(() => false),
  },
}));

beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
    // @ts-ignore
    console.log.mockRestore();
});

describe("ApiClient", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("performs a request using axios instance", async () => {
    const axios = (await import("axios")).default;
    const { Api } = await import("../ApiClient.js");
    const mockedAxios = axios;
    
    const ApiClient = new Api({
        apiUrl: "http://test",
        defaultRouteVersion: "1",
    });

    /** @type {jest.Mock} */
    (mockedAxios.get).mockResolvedValueOnce({}); // health
    /** @type {jest.Mock} */
    (mockedAxios.get).mockResolvedValueOnce({ data: { version: "1" } }); // version

    await ApiClient.connect();

    mockAxiosInstance.request.mockResolvedValue({
      data: null,
      status: 200,
      headers: {},
    });

    await ApiClient.get("health");

    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1);
    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "get",
        url: "health",
      })
    );
  });

  test("maps non-Axios unknown error", async () => {
    const { Api } = await import("../ApiClient.js");

    const api = new Api({
      apiUrl: "http://test",
      defaultRouteVersion: "1",
    });

    await api.connect();

    mockAxiosInstance.request.mockRejectedValue(
      new Error("boom")
    );

    const res = await api.get("health");

    expect(res.ok).toBe(false);
    const err = expectErr(res);
    expect(err.status).toBe(0);
    expect(err.error.message).toBe("boom");
  });

  test("maps Axios error without status", async () => {
    const axios = (await import("axios")).default;
    const { Api } = await import("../ApiClient.js");

    // @ts-ignore
    axios.isAxiosError.mockReturnValue(true);

    const api = new Api({
      apiUrl: "http://test",
      defaultRouteVersion: "1",
    });

    // @ts-ignore
    await api.connect();

    mockAxiosInstance.request.mockRejectedValue({
      message: "Network down",
      response: undefined,
    });

    // @ts-ignore
    const res = await api.get("health");

    expect(res.ok).toBe(false);
    const err = expectErr(res);
    expect(err.status).toBe(0);
    expect(err.error.message).toBe("Network down");
  });

  test("maps 401 Axios error to Unauthorized", async () => {
    const axios = (await import("axios")).default;
    const { Api } = await import("../ApiClient.js");

    // @ts-ignore
    axios.isAxiosError.mockReturnValue(true);

    const api = new Api({
      apiUrl: "http://test",
      defaultRouteVersion: "1",
    });

    // @ts-ignore
    await api.connect();

    mockAxiosInstance.request.mockRejectedValue({
      message: "Unauthorized",
      response: { status: 401, data: {} },
    });

    // @ts-ignore
    const res = await api.get("health");

    expect(res.ok).toBe(false);
    const err = expectErr(res);
    expect(res.status).toBe(401);
    expect(err.error.message).toBe("Unauthorized");
  });
});
