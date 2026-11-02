import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "@/components/marketplace/SearchBar";

describe("SearchBar", () => {
    it("llama onChange cuando se escribe", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<SearchBar value="" onChange={onChange} placeholder="Buscar servicios" />);
        await user.type(screen.getByPlaceholderText("Buscar servicios"), "logo");
        expect(onChange).toHaveBeenCalled();
    });
});
