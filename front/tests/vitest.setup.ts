// -------------------------------------------------------------------------
// Se ejecuta antes de cada archivo de test (setupFiles en vitest.config.ts)
//
// ¿Qué hace?
//   @testing-library/jest-dom/vitest extiende los matchers de Vitest con
//   utilidades específicas del DOM, por ejemplo:
//     expect(element).toBeInTheDocument()
//     expect(element).toHaveTextContent("...")
//     expect(element).toBeDisabled()
//   Sin esta importación esos matchers no existirían.
// -------------------------------------------------------------------------

import "@testing-library/jest-dom/vitest";
