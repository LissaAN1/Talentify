import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.hoisted(() => ({
    get: vi.fn(),
    remove: vi.fn(),
}));

const requestUseMock = vi.hoisted(() => vi.fn());
const responseUseMock = vi.hoisted(() => vi.fn());

const axiosInstanceMock = vi.hoisted(() => ({
    interceptors: {
        request: {
            use: requestUseMock,
        },
        response: {
            use: responseUseMock,
        },
    },
}));

const axiosCreateMock = vi.hoisted(() => vi.fn(() => axiosInstanceMock));

vi.mock("axios", () => ({
    default: {
        create: axiosCreateMock,
    },
}));

vi.mock("js-cookie", () => ({
    default: cookiesMock,
}));

async function loadApiClient() {
    vi.resetModules();

    axiosCreateMock.mockClear();
    requestUseMock.mockClear();
    responseUseMock.mockClear();
    cookiesMock.get.mockReset();
    cookiesMock.remove.mockReset();

    return import("@/services/api-client");
}

describe("apiClient", () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it("crea una instancia de Axios con configuración base", async () => {
        const { apiClient } = await loadApiClient();

        expect(axiosCreateMock).toHaveBeenCalledWith({
            baseURL: "http://localhost:3000",
            headers: {
                "Content-Type": "application/json",
            },
            timeout: 3000,
        });

        expect(apiClient).toBe(axiosInstanceMock);
    });

    it("registra interceptor de request e interceptor de response", async () => {
        await loadApiClient();

        expect(requestUseMock).toHaveBeenCalledTimes(1);
        expect(responseUseMock).toHaveBeenCalledTimes(1);
    });

    it("agrega Authorization Bearer cuando existe token en cookies", async () => {
        await loadApiClient();

        const [onRequestSuccess] = requestUseMock.mock.calls[0];

        cookiesMock.get.mockReturnValue("jwt-token");

        const config = {
            headers: {},
        };

        const result = onRequestSuccess(config);

        expect(cookiesMock.get).toHaveBeenCalledWith("token");
        expect(result.headers.Authorization).toBe("Bearer jwt-token");
    });

    it("no agrega Authorization si no hay token", async () => {
        await loadApiClient();

        const [onRequestSuccess] = requestUseMock.mock.calls[0];

        cookiesMock.get.mockReturnValue(undefined);

        const config = {
            headers: {},
        };

        const result = onRequestSuccess(config);

        expect(cookiesMock.get).toHaveBeenCalledWith("token");
        expect(result.headers.Authorization).toBeUndefined();
    });

    it("propaga errores del interceptor de request", async () => {
        await loadApiClient();

        const [, onRequestError] = requestUseMock.mock.calls[0];

        const error = new Error("Request error");

        await expect(onRequestError(error)).rejects.toBe(error);
    });

    it("retorna la respuesta sin modificar si la petición fue exitosa", async () => {
        await loadApiClient();

        const [onResponseSuccess] = responseUseMock.mock.calls[0];

        const response = {
            data: {
                ok: true,
            },
        };

        expect(onResponseSuccess(response)).toBe(response);
    });

    it("si recibe 401 elimina cookies y redirige al login", async () => {
        vi.stubGlobal("window", {
            location: {
                href: "",
            },
        });

        await loadApiClient();

        const [, onResponseError] = responseUseMock.mock.calls[0];

        const error = {
            response: {
                status: 401,
            },
        };

        await expect(onResponseError(error)).rejects.toBe(error);

        expect(cookiesMock.remove).toHaveBeenCalledWith("token");
        expect(cookiesMock.remove).toHaveBeenCalledWith("currentUser");
        expect(window.location.href).toBe("/login");
    });

    it("si el error no es 401 no elimina sesión", async () => {
        await loadApiClient();

        const [, onResponseError] = responseUseMock.mock.calls[0];

        const error = {
            response: {
                status: 500,
            },
        };

        await expect(onResponseError(error)).rejects.toBe(error);

        expect(cookiesMock.remove).not.toHaveBeenCalled();
    });
});
