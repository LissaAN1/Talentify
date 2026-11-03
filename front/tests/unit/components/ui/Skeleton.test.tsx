import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "@/components/ui/Skeleton";

describe("Skeleton", () => {
    it("renderiza un placeholder", () => {
        const { container } = render(<Skeleton className="h-10" />);
        expect(container.firstChild).toBeInTheDocument();
    });
});
