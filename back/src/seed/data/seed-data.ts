import { AppRoles } from '../../auth/interfaces/app-roles';
import { OrderStatus } from '../../orders/entities/order.entity';
import { ServiceCategory, ServiceStatus } from '../../services/entities/service.entity';

export const seedUsers = [
  {
    name: 'Admin Talentify',
    email: 'admin@u.icesi.edu.co',
    password: 'Admin12345',
    roles: [AppRoles.ADMIN],
    isActive: true,
  },
  {
    name: 'Proveedor Demo',
    email: 'provider@u.icesi.edu.co',
    password: 'Provider12345',
    roles: [AppRoles.PROVIDER],
    isActive: true,
  },
  {
    name: 'Cliente Demo',
    email: 'client@u.icesi.edu.co',
    password: 'Client12345',
    roles: [AppRoles.CLIENT],
    isActive: true,
  },
];

export const seedServices = [
  {
    title: 'Diseño de logo profesional',
    description:
      'Creación de logo profesional para emprendimientos, marcas personales o proyectos universitarios.',
    price: 250000,
    category: ServiceCategory.DESIGN,
    status: ServiceStatus.ACTIVE,
    providerEmail: 'provider@u.icesi.edu.co',
  },
  {
    title: 'Desarrollo de landing page',
    description:
      'Desarrollo de una página web informativa, responsiva y lista para publicar.',
    price: 500000,
    category: ServiceCategory.PROGRAMMING,
    status: ServiceStatus.ACTIVE,
    providerEmail: 'provider@u.icesi.edu.co',
  },
  {
    title: 'Redacción de contenido académico',
    description:
      'Apoyo en redacción, corrección de estilo y estructuración de textos académicos.',
    price: 120000,
    category: ServiceCategory.WRITING,
    status: ServiceStatus.ACTIVE,
    providerEmail: 'provider@u.icesi.edu.co',
  },
];

export const seedOrders = [
  {
    userEmail: 'client@u.icesi.edu.co',
    serviceTitle: 'Diseño de logo profesional',
    status: OrderStatus.PENDING,
    totalAmount: 250000,
    notes: 'Orden inicial de prueba para el servicio de diseño.',
  },
  {
    userEmail: 'client@u.icesi.edu.co',
    serviceTitle: 'Desarrollo de landing page',
    status: OrderStatus.PAID,
    totalAmount: 500000,
    notes: 'Orden pagada de prueba para desarrollo web.',
  },
  {
    userEmail: 'client@u.icesi.edu.co',
    serviceTitle: 'Redacción de contenido académico',
    status: OrderStatus.IN_PROGRESS,
    totalAmount: 120000,
    notes: 'Orden en progreso de prueba para redacción.',
  },
];
