
import { UserRole, LeadStatus, AvailabilityType } from './types';
import bcrypt from 'bcryptjs';

export const getSeedData = async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const users = [
    {
      id: 'USR-ADMIN-01',
      name: 'Harshit Admin',
      email: 'htharshit@gmail.com',
      phone: '9876543210',
      password: adminPassword,
      roles: [UserRole.SUPER_ADMIN],
      permissions: ['admin:*'],
      status: 'active',
      is_approved: 1,
      auth_provider: 'email',
      joined_date: new Date().toISOString(),
      profile_image: '',
      company_name: 'Admin Corp',
      gst_number: '27AAAAA0000A1Z5',
      city: 'Delhi',
      pincode: '110001'
    },
    ...Array.from({ length: 9 }).map((_, i) => ({
      id: `USR-VEND-${i}`,
      name: `Vendor ${i + 1}`,
      email: `vendor${i + 1}@example.com`,
      phone: `900000000${i}`,
      password: hashedPassword,
      roles: [i % 2 === 0 ? UserRole.SELLER : UserRole.TECHNICIAN],
      status: 'active',
      is_approved: 1,
      auth_provider: 'email',
      joined_date: new Date().toISOString(),
      profile_image: '',
      company_name: `Vendor Corp ${i + 1}`,
      gst_number: `27AAAAA0000A1Z${i}`,
      city: ['Delhi', 'Mumbai', 'Bangalore'][i % 3],
      pincode: '400001',
      permissions: []
    }))
  ];

  const leads = Array.from({ length: 10 }).map((_, i) => ({
    id: `LEAD-SEED-${i}`,
    buyerId: users[0].id,
    buyerName: users[0].name,
    requirementName: `Industrial ${['Pump', 'Motor', 'Sensor', 'Controller', 'Valve'][i % 5]} Requirement`,
    description: `Need high-quality ${['pumps', 'motors', 'sensors', 'controllers', 'valves'][i % 5]} for a new manufacturing unit. Specifications: ${i + 1}00 units, standard industrial grade.`,
    budget: 5000 + (i * 1000),
    category: ['Mechanical', 'Electrical', 'Electronics'][i % 3],
    leadImage: `https://picsum.photos/seed/lead${i}/400/300`,
    quantity: 10 + i,
    gstRequired: true,
    negotiationAllowed: true,
    status: LeadStatus.OPEN,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    city: ['Delhi', 'Mumbai', 'Bangalore', 'Chennai'][i % 4]
  }));

  const products = Array.from({ length: 10 }).map((_, i) => ({
    id: `PROD-SEED-${i}`,
    name: `${['Siemens', 'ABB', 'Schneider', 'Honeywell'][i % 4]} ${['PLC', 'Inverter', 'Switch', 'Breaker'][i % 4]} Model X${i}`,
    companyName: `Industrial Solutions ${i + 1}`,
    brand: ['Siemens', 'ABB', 'Schneider', 'Honeywell'][i % 4],
    modelNumber: `X-SERIES-${i}00`,
    price: 12000 + (i * 500),
    category: ['Automation', 'Power', 'Switchgear'][i % 3],
    gstPercent: 18,
    stock: 50,
    specifications: 'Standard industrial specifications for high-performance environments.',
    description: 'Reliable and durable component for industrial automation and power management.',
    availabilityType: AvailabilityType.INSTANT,
    availabilityDays: 0,
    vendorId: users[1].id,
    vendorName: users[1].name,
    productImage: `https://picsum.photos/seed/prod${i}/400/300`,
    status: 'active'
  }));

  return { users, leads, products };
};
