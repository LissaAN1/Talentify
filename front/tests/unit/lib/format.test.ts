import { describe, expect, it } from "vitest";

import { formatCurrencyCOP, formatDate } from "@/lib/format";

function normalizeSpaces(value: string) {
    return value.replace(/\s/g, " ");
}

describe("formatCurrencyCOP", () => {
    it("formatea valores numéricos como pesos colombianos", () => {
        const result = normalizeSpaces(formatCurrencyCOP(80000));

        expect(result).toContain("$");
        expect(result).toContain("80.000");
    });

    it("formatea cero como moneda", () => {
        const result = normalizeSpaces(formatCurrencyCOP(0));

        expect(result).toContain("$");
        expect(result).toContain("0");
    });

    it("usa 0 si recibe un valor nulo o indefinido por seguridad", () => {
        const result = normalizeSpaces(
            formatCurrencyCOP(undefined as unknown as number)
        );

        expect(result).toContain("$");
        expect(result).toContain("0");
    });
});

describe("formatDate", () => {
    it("formatea una fecha válida en español de Colombia", () => {
        const result = formatDate("2026-05-31T10:00:00.000Z");

        expect(result).toMatch(/2026/);
    });

    it("retorna 'Sin fecha' si no recibe fecha", () => {
        expect(formatDate()).toBe("Sin fecha");
    });

    it("retorna 'Sin fecha' si recibe string vacío", () => {
        expect(formatDate("")).toBe("Sin fecha");
    });
});
