import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Cleaning database (preserving admins)...');
  
  // Get existing platform admins to preserve
  const existingAdmins = await prisma.platformAdmin.findMany({
    select: { admin_id: true, email: true, role: true }
  });
  
  console.log(`Found ${existingAdmins.length} platform admins to preserve`);

  // Delete all data except platform admins
  await prisma.$transaction([
    // Delete tenant-related data
    prisma.order.deleteMany({}),
    prisma.cartItem.deleteMany({}),
    prisma.cart.deleteMany({}),
    prisma.menuItem.deleteMany({}),
    prisma.menuCategory.deleteMany({}),
    prisma.menu.deleteMany({}),
    prisma.offer.deleteMany({}),
    prisma.userRole.deleteMany({}),
    prisma.rolePermission.deleteMany({}),
    prisma.role.deleteMany({}),
    prisma.user.deleteMany({}),
    prisma.tenantSetting.deleteMany({}),
    prisma.tenantFeature.deleteMany({}),
    prisma.platformAdminTenant.deleteMany({}),
    prisma.tenant.deleteMany({}),
  ]);

  console.log('✅ Database cleaned');

  // 1. Create Permissions
  console.log('📝 Creating permissions...');
  const permissions = [
    'menu.read', 'menu.write',
    'offer.read', 'offer.write',
    'order.read', 'order.write', 'order.status.update',
    'payment.create', 'payment.refund',
    'delivery.task.assign', 'delivery.task.update',
    'settings.read', 'settings.write',
    'media.upload', 'media.link',
    'analytics.read',
    'customer.read', 'customer.write'
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p },
      update: {},
      create: { name: p, scope: 'tenant', description: '' }
    });
  }

  // 2. Create Features
  console.log('🎨 Creating features...');
  const features = [
    { feature_key: 'ORDERS', default_enabled: true, description: 'Enable orders management' },
    { feature_key: 'MENU', default_enabled: true, description: 'Enable menu management' },
    { feature_key: 'CUSTOMERS', default_enabled: true, description: 'Enable customers management' },
    { feature_key: 'ANALYTICS', default_enabled: true, description: 'Enable analytics dashboards' },
    { feature_key: 'MARKETING', default_enabled: true, description: 'Enable marketing & promotions' },
    { feature_key: 'PAYMENT', default_enabled: true, description: 'Enable payments' },
    { feature_key: 'DELIVERY_TRACKING', default_enabled: true, description: 'Enable delivery tracking' },
    { feature_key: 'WEB_CLIENT', default_enabled: true, description: 'Enable web ordering client' },
    { feature_key: 'INVOICING', default_enabled: false, description: 'Enable invoices' }
  ];

  for (const f of features) {
    await prisma.feature.upsert({
      where: { feature_key: f.feature_key },
      update: {},
      create: f
    });
  }

  // 3. Create Demo Restaurants
  console.log('🍽️  Creating demo restaurants...');
  
  const restaurants = [
    {
      name: 'Bella Italia',
      domain: 'bella-italia.com',
      currency_code: 'USD',
      ownerEmail: 'owner@bella-italia.com',
      ownerPassword: 'owner123',
      features: { ORDERS: true, MENU: true, CUSTOMERS: true, ANALYTICS: true, MARKETING: true },
      categories: [
        { name: 'Appetizers', items: [
          { name: 'Bruschetta', description: 'Grilled bread with tomatoes, garlic, and basil', price: 8.99, image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f' },
          { name: 'Caprese Salad', description: 'Fresh mozzarella, tomatoes, and basil', price: 10.99, image_url: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804' },
          { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 5.99, image_url: 'https://images.unsplash.com/photo-1573140401552-388e5ae4e28f' }
        ]},
        { name: 'Pasta', items: [
          { name: 'Spaghetti Carbonara', description: 'Classic Roman pasta with eggs, cheese, and pancetta', price: 16.99, image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3' },
          { name: 'Fettuccine Alfredo', description: 'Creamy parmesan sauce with fettuccine', price: 15.99, image_url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a' },
          { name: 'Penne Arrabbiata', description: 'Spicy tomato sauce with penne pasta', price: 14.99, image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9' },
          { name: 'Lasagna', description: 'Layers of pasta, meat sauce, and cheese', price: 17.99, image_url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3' }
        ]},
        { name: 'Pizza', items: [
          { name: 'Margherita Pizza', description: 'Tomato sauce, mozzarella, and basil', price: 13.99, image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002' },
          { name: 'Pepperoni Pizza', description: 'Classic pepperoni with mozzarella', price: 15.99, image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e' },
          { name: 'Quattro Formaggi', description: 'Four cheese pizza', price: 16.99, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591' }
        ]},
        { name: 'Desserts', items: [
          { name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert', price: 7.99, image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9' },
          { name: 'Panna Cotta', description: 'Creamy vanilla dessert with berry sauce', price: 6.99, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777' },
          { name: 'Gelato', description: 'Italian ice cream - ask for flavors', price: 5.99, image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb' }
        ]}
      ]
    },
    {
      name: 'Sushi Master',
      domain: 'sushi-master.com',
      currency_code: 'USD',
      ownerEmail: 'owner@sushi-master.com',
      ownerPassword: 'owner123',
      features: { ORDERS: true, MENU: true, CUSTOMERS: true, ANALYTICS: false, MARKETING: true },
      categories: [
        { name: 'Nigiri', items: [
          { name: 'Salmon Nigiri', description: 'Fresh salmon over sushi rice', price: 6.99, image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351' },
          { name: 'Tuna Nigiri', description: 'Premium tuna over sushi rice', price: 7.99, image_url: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93' },
          { name: 'Eel Nigiri', description: 'Grilled eel with sweet sauce', price: 8.99, image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56' }
        ]},
        { name: 'Rolls', items: [
          { name: 'California Roll', description: 'Crab, avocado, and cucumber', price: 12.99, image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351' },
          { name: 'Spicy Tuna Roll', description: 'Tuna with spicy mayo', price: 13.99, image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56' },
          { name: 'Dragon Roll', description: 'Eel and cucumber topped with avocado', price: 16.99, image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351' },
          { name: 'Rainbow Roll', description: 'California roll topped with assorted fish', price: 18.99, image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56' }
        ]},
        { name: 'Sashimi', items: [
          { name: 'Salmon Sashimi', description: '6 pieces of fresh salmon', price: 14.99, image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351' },
          { name: 'Tuna Sashimi', description: '6 pieces of premium tuna', price: 16.99, image_url: 'https://images.unsplash.com/photo-1564489563601-c53cfc451e93' },
          { name: 'Mixed Sashimi', description: 'Assorted fresh fish', price: 24.99, image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56' }
        ]}
      ]
    },
    {
      name: 'Burger Haven',
      domain: 'burger-haven.com',
      currency_code: 'USD',
      ownerEmail: 'owner@burger-haven.com',
      ownerPassword: 'owner123',
      features: { ORDERS: true, MENU: true, CUSTOMERS: false, ANALYTICS: true, MARKETING: false },
      categories: [
        { name: 'Burgers', items: [
          { name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, onion', price: 10.99, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd' },
          { name: 'Cheeseburger', description: 'Classic burger with cheddar cheese', price: 11.99, image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349' },
          { name: 'Bacon Burger', description: 'Burger with crispy bacon and BBQ sauce', price: 13.99, image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b' },
          { name: 'Mushroom Swiss Burger', description: 'Sautéed mushrooms and Swiss cheese', price: 12.99, image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5' }
        ]},
        { name: 'Sides', items: [
          { name: 'French Fries', description: 'Crispy golden fries', price: 4.99, image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877' },
          { name: 'Onion Rings', description: 'Beer-battered onion rings', price: 5.99, image_url: 'https://images.unsplash.com/photo-1639024471283-03518883512d' },
          { name: 'Coleslaw', description: 'Fresh cabbage slaw', price: 3.99, image_url: 'https://images.unsplash.com/photo-1625938145312-598e25f2b4e4' }
        ]},
        { name: 'Drinks', items: [
          { name: 'Coca Cola', description: 'Classic Coke', price: 2.99, image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7' },
          { name: 'Milkshake', description: 'Vanilla, chocolate, or strawberry', price: 5.99, image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699' },
          { name: 'Iced Tea', description: 'Fresh brewed iced tea', price: 2.99, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc' }
        ]}
      ]
    },
    {
      name: 'Taco Fiesta',
      domain: 'taco-fiesta.com',
      currency_code: 'USD',
      ownerEmail: 'owner@taco-fiesta.com',
      ownerPassword: 'owner123',
      features: { ORDERS: true, MENU: true, CUSTOMERS: true, ANALYTICS: true, MARKETING: true },
      categories: [
        { name: 'Tacos', items: [
          { name: 'Beef Taco', description: 'Seasoned ground beef with lettuce and cheese', price: 3.99, image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47' },
          { name: 'Chicken Taco', description: 'Grilled chicken with pico de gallo', price: 4.49, image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b' },
          { name: 'Fish Taco', description: 'Crispy fish with cabbage slaw', price: 5.99, image_url: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5' },
          { name: 'Carnitas Taco', description: 'Slow-cooked pork with cilantro and onions', price: 4.99, image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47' }
        ]},
        { name: 'Burritos', items: [
          { name: 'Bean Burrito', description: 'Refried beans, rice, and cheese', price: 8.99, image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f' },
          { name: 'Chicken Burrito', description: 'Grilled chicken, rice, beans, and salsa', price: 10.99, image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f' },
          { name: 'Steak Burrito', description: 'Grilled steak with all the fixings', price: 12.99, image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f' }
        ]},
        { name: 'Sides', items: [
          { name: 'Chips & Salsa', description: 'Crispy tortilla chips with fresh salsa', price: 4.99, image_url: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b' },
          { name: 'Guacamole', description: 'Fresh made guacamole', price: 3.99, image_url: 'https://images.unsplash.com/photo-1604903279146-b3e1e8c9e1f0' },
          { name: 'Mexican Rice', description: 'Seasoned rice with tomatoes', price: 3.99, image_url: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7' }
        ]}
      ]
    },
    {
      name: 'Thai Spice',
      domain: 'thai-spice.com',
      currency_code: 'USD',
      ownerEmail: 'owner@thai-spice.com',
      ownerPassword: 'owner123',
      features: { ORDERS: true, MENU: true, CUSTOMERS: true, ANALYTICS: true, MARKETING: true },
      categories: [
        { name: 'Curries', items: [
          { name: 'Green Curry', description: 'Spicy green curry with coconut milk', price: 14.99, image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd' },
          { name: 'Red Curry', description: 'Rich red curry with vegetables', price: 14.99, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7' },
          { name: 'Massaman Curry', description: 'Mild curry with peanuts and potatoes', price: 15.99, image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd' }
        ]},
        { name: 'Noodles', items: [
          { name: 'Pad Thai', description: 'Stir-fried rice noodles with shrimp', price: 13.99, image_url: 'https://images.unsplash.com/photo-1559314809-0d155014e29e' },
          { name: 'Drunken Noodles', description: 'Spicy stir-fried noodles with basil', price: 13.99, image_url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841' },
          { name: 'Pad See Ew', description: 'Wide noodles with soy sauce', price: 12.99, image_url: 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12' }
        ]},
        { name: 'Appetizers', items: [
          { name: 'Spring Rolls', description: 'Fresh vegetable spring rolls', price: 6.99, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb' },
          { name: 'Satay Chicken', description: 'Grilled chicken skewers with peanut sauce', price: 8.99, image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398' },
          { name: 'Tom Yum Soup', description: 'Spicy and sour soup with shrimp', price: 7.99, image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd' }
        ]}
      ]
    }
  ];

  const allPermissions = await prisma.permission.findMany();
  const allFeatures = await prisma.feature.findMany();

  for (const restaurant of restaurants) {
    console.log(`  Creating ${restaurant.name}...`);
    
    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: restaurant.name,
        domain: restaurant.domain,
        status: 'active',
        currency_code: restaurant.currency_code
      }
    });

    // Enable features
    for (const feature of allFeatures) {
      const isEnabled = restaurant.features[feature.feature_key as keyof typeof restaurant.features] ?? feature.default_enabled;
      await prisma.tenantFeature.create({
        data: {
          tenant_id: tenant.tenant_id,
          feature_id: feature.feature_id,
          is_enabled: isEnabled
        }
      });
    }

    // Create roles
    const ownerRole = await prisma.role.create({
      data: {
        tenant_id: tenant.tenant_id,
        name: 'OWNER',
        description: 'Restaurant Owner'
      }
    });

    const staffRole = await prisma.role.create({
      data: {
        tenant_id: tenant.tenant_id,
        name: 'STAFF',
        description: 'Restaurant Staff'
      }
    });

    const customerRole = await prisma.role.create({
      data: {
        tenant_id: tenant.tenant_id,
        name: 'CUSTOMER',
        description: 'Customer'
      }
    });

    // Assign all permissions to owner
    for (const perm of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          role_id: ownerRole.role_id,
          permission_id: perm.permission_id,
          tenant_id: tenant.tenant_id
        }
      });
    }

    // Assign subset to staff
    const staffPermKeys = ['menu.read', 'menu.write', 'order.read', 'order.write', 'order.status.update'];
    const staffPerms = allPermissions.filter(p => staffPermKeys.includes(p.name));
    for (const perm of staffPerms) {
      await prisma.rolePermission.create({
        data: {
          role_id: staffRole.role_id,
          permission_id: perm.permission_id,
          tenant_id: tenant.tenant_id
        }
      });
    }

    // Create owner user
    const passwordHash = await bcrypt.hash(restaurant.ownerPassword, 10);
    const ownerUser = await prisma.user.create({
      data: {
        tenant_id: tenant.tenant_id,
        email: restaurant.ownerEmail,
        password_hash: passwordHash,
        status: 'active'
      }
    });

    await prisma.userRole.create({
      data: {
        user_id: ownerUser.user_id,
        role_id: ownerRole.role_id,
        tenant_id: tenant.tenant_id
      }
    });

    // Create menu
    const menu = await prisma.menu.create({
      data: {
        tenant_id: tenant.tenant_id,
        name: 'Main Menu',
        description: 'Our main menu',
        is_active: true
      }
    });

    // Create categories and items
    for (let catIndex = 0; catIndex < restaurant.categories.length; catIndex++) {
      const cat = restaurant.categories[catIndex];
      const category = await prisma.menuCategory.create({
        data: {
          tenant_id: tenant.tenant_id,
          menu_id: menu.menu_id,
          name: cat.name,
          order_index: catIndex + 1
        }
      });

      for (const item of cat.items) {
        await prisma.menuItem.create({
          data: {
            tenant_id: tenant.tenant_id,
            category_id: category.category_id,
            name: item.name,
            description: item.description,
            price: item.price,
            is_available: true
          }
        });
      }
    }

    // Create some demo customers
    const customerEmails = [
      'john.doe@example.com',
      'jane.smith@example.com',
      'mike.johnson@example.com'
    ];

    for (const email of customerEmails) {
      const customerHash = await bcrypt.hash('customer123', 10);
      const customer = await prisma.user.create({
        data: {
          tenant_id: tenant.tenant_id,
          email: email,
          password_hash: customerHash,
          phone: '+1234567890',
          status: 'active'
        }
      });

      await prisma.userRole.create({
        data: {
          user_id: customer.user_id,
          role_id: customerRole.role_id,
          tenant_id: tenant.tenant_id
        }
      });
    }

    // Assign restaurant to first platform admin if exists
    if (existingAdmins.length > 0) {
      const platformAdmin = existingAdmins.find(a => a.role === 'PLATFORM_ADMIN') || existingAdmins[0];
      await prisma.platformAdminTenant.create({
        data: {
          admin_id: platformAdmin.admin_id,
          tenant_id: tenant.tenant_id,
          assigned_by: existingAdmins[0].admin_id
        }
      });
    }

    console.log(`  ✅ ${restaurant.name} created with ${restaurant.categories.length} categories`);
  }

  console.log('\n🎉 Demo data seeded successfully!');
  console.log('\n📋 Restaurant Credentials:');
  console.log('   All owners: password = owner123');
  console.log('   All customers: password = customer123');
  console.log('\n🏪 Restaurants created:');
  for (const r of restaurants) {
    console.log(`   - ${r.name} (${r.ownerEmail})`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
