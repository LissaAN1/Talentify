// -------------------------------------------------------------------
// Configuración de Vitest para las pruebas unitarias del proyecto:
//
// Puntos clave (apuntes):
//  - environment: "jsdom" ---> simula el DOM del navegador, necesario
//    para renderizar componentes React con Testing Library.
//
//  - globals: true -> permite usar describe/it/expect sin importarlos
//    en cada archivo de test.
//
//  - setupFiles -------> carga jest-dom para los matchers adicionales
//    (toBeInTheDocument, toHaveTextContent, etc.).
//
//  - resolve.alias "@" ----> mapea @/ a src/ igual que tsconfig.json,
//    para que los imports de los componentes resuelvan correctamente.
//
//  - coverage ------> configurado con v8 (rápido, sin instrumentación
//    adicional) para generar informes en /coverage.
// -------------------------------------------------------------------

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    // Necesario para que Vitest procese componentes React!
    react(),
  ],

  test: {
    // jsdom simula window, document y el DOM del navegador sin necesidad
    // de un browser real.
    environment: "jsdom",

    // Permite usar describe, it, expect y vi sin importar en cada test.
    globals: true,

    // Archivos que se ejecutan antes de cada suite de tests.
    // vitest.setup.ts carga los matchers de @testing-library/jest-dom.
    setupFiles: ["./tests/vitest.setup.ts"],

    // Permite cargar los estilos que usan los componentes durante los tests.
    css: true,

    // Patrón de búsqueda de archivos de test.
    // Busca .test.ts(x) y .spec.ts(x) dentro de tests/unit/.
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],

    // Evita mezclar las pruebas unitarias con e2e y carpetas generadas.
    exclude: [
      "node_modules",
      ".next",
      "tests/e2e",
      "playwright-report",
      "test-results",
    ],

    // Configuración de cobertura de código:
    coverage: {
      // Proveedor v8: integrado en Node, sin babel-plugin.
      provider: "v8",

      // Carpeta de salida del informe de cobertura.
      reportsDirectory: "./coverage",

      // Formatos de informe generados.
      reporter: ["text", "html", "json-summary"],

      // Archivos que se incluyen en el análisis de cobertura.
      include: [
        "src/components/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
        "src/constants/**/*.{ts,tsx}",
        "src/services/**/*.{ts,tsx}",
        "src/store/**/*.{ts,tsx}",
      ],

      // Excluye archivos que no tienen lógica propia que testear.
      exclude: [
        "src/**/*.d.ts",
        "src/app/**",
        "src/middleware.ts",
        "src/services/services.service.ts",
      ],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
