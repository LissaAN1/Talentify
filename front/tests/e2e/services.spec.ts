import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import {
    mockServicesApi,
    activeServiceProgramming,
    activeServiceDesign,
    inactiveService,
} from "./helpers/services-mock";

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

test.describe("Services — PROVIDER", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "PROVIDER", baseURL!);
    });

    // ── Listado ───────────────────────────────────────────────────────────────

    test("muestra secciones 'Servicios disponibles' y 'Mis servicios'", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        await expect(
            page.getByRole("heading", { name: "Gestión de servicios" }),
        ).toBeVisible();

        await expect(page.getByText("Servicios disponibles")).toBeVisible();
        await expect(page.getByText("Mis servicios")).toBeVisible();
    });

    test("lista los servicios activos disponibles en la plataforma", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        await expect(page.getByText("Desarrollo de landing page").first()).toBeVisible();
        await expect(page.getByText("Diseño de logo").first()).toBeVisible();
    });

    test("lista los servicios propios (activos e inactivos)", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        // inactiveService pertenece al proveedor y aparece en "Mis servicios"
        await expect(page.getByText("Fotografía de producto")).toBeVisible();

        // El badge de inactivo debe estar presente
        await expect(page.getByText("Inactivo")).toBeVisible();
    });

    test("muestra el botón 'Nuevo servicio'", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        await expect(
            page.getByRole("link", { name: "Nuevo servicio" }),
        ).toBeVisible();
    });

    // ── Detalle ───────────────────────────────────────────────────────────────

    test("cada tarjeta de servicio expone el enlace correcto al detalle", async ({ page }) => {
        await mockServicesApi(page, { singleService: activeServiceProgramming });
        await page.goto("/services");

        const serviceCard = page
            .locator("article, .tf-card")
            .filter({ hasText: activeServiceProgramming.title })
            .first();

        const detailLink = serviceCard.getByRole("link", { name: "Ver detalle" });

        await expect(detailLink).toBeVisible();
        await expect(detailLink).toHaveAttribute(
            "href",
            `/services/${activeServiceProgramming.id}`,
        );
    });

    test("el detalle muestra descripción, precio, proveedor y fechas", async ({ page }) => {
        await mockServicesApi(page, { singleService: activeServiceProgramming });
        await page.goto(`/services/${activeServiceProgramming.id}`);

        await expect(page.getByText(activeServiceProgramming.description)).toBeVisible();
        await expect(page.getByText("Proveedor")).toBeVisible();
        await expect(page.getByText("Proveedor Talentify")).toBeVisible();
        await expect(page.getByText("Precio")).toBeVisible();
        await expect(page.getByText("Creado")).toBeVisible();
    });

    test("el detalle muestra error cuando el servicio no existe", async ({ page }) => {
        await mockServicesApi(page, { detailError: true });
        await page.goto("/services/00000000-0000-0000-0000-000000000000");

        await expect(page.getByText("No fue posible cargar el servicio")).toBeVisible();
        await expect(page.getByText("Volver a servicios")).toBeVisible();
    });

    // ── Creación ──────────────────────────────────────────────────────────────

    test("navega al formulario de creación al hacer clic en 'Nuevo servicio'", async ({
                                                                                          page,
                                                                                      }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        await page.getByRole("link", { name: "Nuevo servicio" }).click();

        await expect(page).toHaveURL(/\/services\/new$/);
        await expect(
            page.getByRole("heading", { name: "Crear servicio" }),
        ).toBeVisible();
    });

    test("muestra errores de validación al enviar el formulario vacío", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services/new");

        await page.getByRole("button", { name: "Publicar servicio" }).click();

        await expect(page.getByText("El título es obligatorio.")).toBeVisible();
        await expect(page.getByText("La descripción es obligatoria.")).toBeVisible();
        await expect(page.getByText("La categoría es obligatoria.")).toBeVisible();
        await expect(page.getByText("El precio es obligatorio.")).toBeVisible();
    });

    test("crea un servicio exitosamente y redirige al detalle", async ({ page }) => {
        await mockServicesApi(page, { singleService: activeServiceDesign });
        await page.goto("/services/new");

        await page.getByLabel("Título").fill("Servicio de prueba E2E");
        await page.getByLabel("Descripción").fill("Descripción completa del servicio de prueba automatizado.");
        await page.getByLabel("Categoría").selectOption("DESIGN");
        await page.getByLabel("Precio").fill("75000");

        await page.getByRole("button", { name: "Publicar servicio" }).click();

        // Redirige al detalle del servicio recién creado
        await expect(page).toHaveURL(
            /\/services\/[\w-]+$/,
        );
    });

    test("muestra error de API al fallar la creación", async ({ page }) => {
        await mockServicesApi(page, { createError: true });
        await page.goto("/services/new");

        await page.getByLabel("Título").fill("Servicio de prueba");
        await page.getByLabel("Descripción").fill("Descripción de prueba suficiente.");
        await page.getByLabel("Categoría").selectOption("MARKETING");
        await page.getByLabel("Precio").fill("50000");

        await page.getByRole("button", { name: "Publicar servicio" }).click();

        await expect(page.getByText("No fue posible guardar el servicio")).toBeVisible();
    });

    // ── Edición ───────────────────────────────────────────────────────────────

    test("carga el formulario de edición con los valores actuales del servicio", async ({
                                                                                            page,
                                                                                        }) => {
        await mockServicesApi(page, { singleService: activeServiceProgramming });
        await page.goto(`/services/${activeServiceProgramming.id}/edit`);

        await expect(
            page.getByRole("heading", { name: "Editar servicio" }),
        ).toBeVisible();

        const titleInput = page.getByLabel("Título");
        await expect(titleInput).toHaveValue(activeServiceProgramming.title);
    });

    test("guarda los cambios y redirige al detalle", async ({ page }) => {
        await mockServicesApi(page, { singleService: activeServiceProgramming });
        await page.goto(`/services/${activeServiceProgramming.id}/edit`);

        const titleInput = page.getByLabel("Título");
        await titleInput.fill("Título actualizado por prueba");

        await page.getByRole("button", { name: "Guardar cambios" }).click();

        await expect(page).toHaveURL(
            new RegExp(`/services/${activeServiceProgramming.id}$`),
        );
    });

    test("el formulario de edición muestra error si falla la actualización", async ({
                                                                                        page,
                                                                                    }) => {
        await mockServicesApi(page, {
            singleService: activeServiceProgramming,
            updateError: true,
        });
        await page.goto(`/services/${activeServiceProgramming.id}/edit`);

        await page.getByLabel("Título").fill("Nuevo título de prueba E2E");
        await page.getByRole("button", { name: "Guardar cambios" }).click();

        await expect(page.getByText("No fue posible guardar el servicio")).toBeVisible();
    });

    // ── Desactivación ─────────────────────────────────────────────────────────

    test("desactiva un servicio desde la lista tras confirmar el diálogo", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        // Hace clic en el botón "Desactivar" del primer servicio activo
        await page.getByRole("button", { name: "Desactivar" }).first().click();

        // Aparece el diálogo de confirmación
        await expect(page.getByText("Desactivar servicio")).toBeVisible();
        await expect(page.getByText("¿Deseas desactivar")).toBeVisible();

        // Confirma la acción
        await page.getByRole("button", { name: "Sí, desactivar" }).click();

        // Aparece el mensaje de éxito
        await expect(
            page.getByText(/fue desactivado correctamente/),
        ).toBeVisible();
    });

    test("cancela la desactivación y el servicio permanece activo", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        await page.getByRole("button", { name: "Desactivar" }).first().click();
        await expect(page.getByText("Desactivar servicio")).toBeVisible();

        await page.getByRole("button", { name: "Cancelar" }).click();

        // El diálogo desaparece; no hay mensaje de éxito
        await expect(page.getByText("Desactivar servicio")).not.toBeVisible();
        await expect(page.getByText("fue desactivado correctamente")).not.toBeVisible();
    });

    test("desactiva un servicio desde la página de detalle", async ({ page }) => {
        await mockServicesApi(page, { singleService: activeServiceProgramming });
        await page.goto(`/services/${activeServiceProgramming.id}`);

        await page.getByRole("button", { name: "Desactivar" }).click();
        await expect(page.getByText("Desactivar servicio")).toBeVisible();

        await page.getByRole("button", { name: "Sí, desactivar" }).click();

        await expect(page.getByText("El servicio fue desactivado correctamente.")).toBeVisible();
    });

    // ── Errores en la lista ───────────────────────────────────────────────────

    test("muestra alerta de error cuando falla la carga de servicios disponibles", async ({
                                                                                              page,
                                                                                          }) => {
        await mockServicesApi(page, { listError: true });
        await page.goto("/services");

        await expect(page.getByText("No fue posible cargar los servicios")).toBeVisible();
    });

    test("muestra alerta de error cuando falla la carga de mis servicios", async ({ page }) => {
        await mockServicesApi(page, { myServicesError: true });
        await page.goto("/services");

        await expect(page.getByText("No fue posible cargar tus servicios")).toBeVisible();
    });

    test("muestra alerta de error cuando falla la desactivación", async ({ page }) => {
        await mockServicesApi(page, { deleteError: true });
        await page.goto("/services");

        await page.getByRole("button", { name: "Desactivar" }).first().click();
        await page.getByRole("button", { name: "Sí, desactivar" }).click();

        await expect(page.getByText("No fue posible desactivar el servicio")).toBeVisible();
    });
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

test.describe("Services — ADMIN", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "ADMIN", baseURL!);
    });

    test("administrador ve el listado de servicios disponibles", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        await expect(page.getByText("Servicios disponibles")).toBeVisible();
        await expect(page.getByText("Desarrollo de landing page").first()).toBeVisible();
    });

    test("administrador puede desactivar un servicio desde el detalle", async ({ page }) => {
        await mockServicesApi(page, { singleService: activeServiceProgramming });

        await page.goto(`/services/${activeServiceProgramming.id}`);

        await expect(
            page.getByRole("heading", { name: activeServiceProgramming.title }),
        ).toBeVisible();

        await page.getByRole("button", { name: "Desactivar" }).click();

        await expect(page.getByText("Desactivar servicio")).toBeVisible();

        await page.getByRole("button", { name: "Sí, desactivar" }).click();

        await expect(
            page.getByText("El servicio fue desactivado correctamente."),
        ).toBeVisible();
    });

    test("administrador puede navegar al detalle y editar cualquier servicio", async ({
                                                                                          page,
                                                                                      }) => {
        await mockServicesApi(page, { singleService: activeServiceProgramming });
        await page.goto(`/services/${activeServiceProgramming.id}`);

        await expect(
            page.getByRole("heading", { name: activeServiceProgramming.title }),
        ).toBeVisible();
        await expect(page.getByRole("link", { name: "Editar" })).toBeVisible();
    });

    test("administrador ve el botón 'Nuevo servicio'", async ({ page }) => {
        await mockServicesApi(page);
        await page.goto("/services");

        await expect(
            page.getByRole("link", { name: "Nuevo servicio" }),
        ).toBeVisible();
    });
});

// ─── Servicios inactivos ──────────────────────────────────────────────────────

test.describe("Services — servicio inactivo", () => {
    test.beforeEach(async ({ context, baseURL }) => {
        await loginAs(context, "PROVIDER", baseURL!);
    });

    test("el detalle de un servicio inactivo muestra badge 'Inactivo' sin botón Desactivar", async ({
                                                                                                        page,
                                                                                                    }) => {
        await mockServicesApi(page, { singleService: inactiveService });
        await page.goto(`/services/${inactiveService.id}`);

        await expect(page.getByText("Inactivo")).toBeVisible();
        await expect(
            page.getByRole("button", { name: "Desactivar" }),
        ).not.toBeVisible();
    });
});
