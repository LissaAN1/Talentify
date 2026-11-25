// Carga las variables de entorno antes de las pruebas e2e.
// En local se leen de back/.env; en CI vienen del workflow.
try {
  process.loadEnvFile('.env');
} catch {
  // sin .env: se usan las variables ya definidas en el entorno
}
process.env.JWT_SECRET ??= 'test-secret';
