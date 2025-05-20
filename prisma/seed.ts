import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data
  await prisma.orderStatusUpdate.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.table.deleteMany();
  await prisma.dietaryTag.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Create users
  const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
  const hashedUserPassword = await bcrypt.hash('User123!', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@restaurant.com',
      password: hashedAdminPassword,
      role: Role.ADMIN,
      phone: '123-456-7890',
    },
  });

  const chef = await prisma.user.create({
    data: {
      name: 'Head Chef',
      email: 'chef@restaurant.com',
      password: hashedAdminPassword,
      role: Role.CHEF,
      phone: '123-456-7891',
    },
  });

  const waiter = await prisma.user.create({
    data: {
      name: 'Waiter Staff',
      email: 'waiter@restaurant.com',
      password: hashedAdminPassword,
      role: Role.WAITER,
      phone: '123-456-7892',
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'John Customer',
      email: 'customer@example.com',
      password: hashedUserPassword,
      role: Role.USER,
      phone: '123-456-7893',
    },
  });

  console.log('Created users');

  // Create tables
  const tables = await Promise.all([
    prisma.table.create({
      data: { tableNumber: 1, seats: 2, location: 'Window' },
    }),
    prisma.table.create({
      data: { tableNumber: 2, seats: 4, location: 'Window' },
    }),
    prisma.table.create({
      data: { tableNumber: 3, seats: 6, location: 'Middle' },
    }),
    prisma.table.create({
      data: { tableNumber: 4, seats: 2, location: 'Bar' },
    }),
    prisma.table.create({
      data: { tableNumber: 5, seats: 8, location: 'Private Room' },
    }),
  ]);

  console.log('Created tables');

  // Create dietary tags
  const vegetarianTag = await prisma.dietaryTag.create({
    data: {
      name: 'Vegetarian',
      description: 'No meat, fish, or animal products except dairy and eggs',
      color: 'green',
    },
  });

  const veganTag = await prisma.dietaryTag.create({
    data: {
      name: 'Vegan',
      description: 'No animal products whatsoever',
      color: 'green',
    },
  });

  const glutenFreeTag = await prisma.dietaryTag.create({
    data: {
      name: 'Gluten Free',
      description: 'No gluten-containing ingredients',
      color: 'yellow',
    },
  });

  const dairyFreeTag = await prisma.dietaryTag.create({
    data: {
      name: 'Dairy Free',
      description: 'No dairy ingredients',
      color: 'blue',
    },
  });

  const spicyTag = await prisma.dietaryTag.create({
    data: {
      name: 'Spicy',
      description: 'Dish is spicy',
      color: 'red',
    },
  });

  console.log('Created dietary tags');

  // Create menu
  const mainMenu = await prisma.menu.create({
    data: {
      name: 'Main Menu',
      description: 'Our regular dining menu',
      isActive: true,
    },
  });

  // Create categories
  const appetizerCategory = await prisma.category.create({
    data: {
      name: 'Appetizers',
      description: 'Small dishes to start your meal',
    },
  });

  const mainCourseCategory = await prisma.category.create({
    data: {
      name: 'Main Courses',
      description: 'Hearty main dishes',
    },
  });

  const pastaCategory = await prisma.category.create({
    data: {
      name: 'Pasta & Risotto',
      description: 'Italian pasta and risotto dishes',
    },
  });

  const dessertCategory = await prisma.category.create({
    data: {
      name: 'Desserts',
      description: 'Sweet treats to finish your meal',
    },
  });

  const drinksCategory = await prisma.category.create({
    data: {
      name: 'Drinks',
      description: 'Refreshing beverages',
    },
  });

  console.log('Created categories');

  // Create menu items
  // Appetizers
  const bruschetta = await prisma.menuItem.create({
    data: {
      name: 'Bruschetta',
      description: 'Grilled bread rubbed with garlic and topped with olive oil, salt, tomato, and basil',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1572695157366-5e585ab80baa?q=80&w=500',
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isDairyFree: true,
      menuId: mainMenu.id,
      categoryId: appetizerCategory.id,
      dietary: {
        connect: [{ id: vegetarianTag.id }, { id: veganTag.id }, { id: dairyFreeTag.id }],
      },
    },
  });

  const calamari = await prisma.menuItem.create({
    data: {
      name: 'Fried Calamari',
      description: 'Crispy fried squid served with marinara sauce',
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?q=80&w=500',
      isAvailable: true,
      isPescatarian: true,
      menuId: mainMenu.id,
      categoryId: appetizerCategory.id,
    },
  });

  // Main courses
  const steak = await prisma.menuItem.create({
    data: {
      name: 'Ribeye Steak',
      description: '12oz ribeye steak with garlic butter, served with roasted potatoes and seasonal vegetables',
      price: 29.99,
      image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=500',
      isAvailable: true,
      isGlutenFree: true,
      menuId: mainMenu.id,
      categoryId: mainCourseCategory.id,
      dietary: {
        connect: [{ id: glutenFreeTag.id }],
      },
    },
  });

  const salmon = await prisma.menuItem.create({
    data: {
      name: 'Grilled Salmon',
      description: 'Fresh salmon fillet grilled with lemon and herbs, served with rice pilaf and asparagus',
      price: 24.99,
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=500',
      isAvailable: true,
      isPescatarian: true,
      isGlutenFree: true,
      isDairyFree: true,
      menuId: mainMenu.id,
      categoryId: mainCourseCategory.id,
      dietary: {
        connect: [{ id: glutenFreeTag.id }, { id: dairyFreeTag.id }],
      },
    },
  });

  // Pasta
  const spaghetti = await prisma.menuItem.create({
    data: {
      name: 'Spaghetti Bolognese',
      description: 'Classic spaghetti with rich beef bolognese sauce and parmesan cheese',
      price: 16.99,
      image: 'https://images.unsplash.com/photo-1622973536968-3ead9e780960?q=80&w=500',
      isAvailable: true,
      menuId: mainMenu.id,
      categoryId: pastaCategory.id,
    },
  });

  const pastaVegetable = await prisma.menuItem.create({
    data: {
      name: 'Vegetable Pasta Primavera',
      description: 'Mixed vegetable pasta with light cream sauce',
      price: 15.99,
      image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=500',
      isAvailable: true,
      isVegetarian: true,
      menuId: mainMenu.id,
      categoryId: pastaCategory.id,
      dietary: {
        connect: [{ id: vegetarianTag.id }],
      },
    },
  });

  // Desserts
  const tiramisu = await prisma.menuItem.create({
    data: {
      name: 'Tiramisu',
      description: 'Classic Italian dessert with layers of coffee-soaked ladyfingers and mascarpone cream',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=500',
      isAvailable: true,
      isVegetarian: true,
      menuId: mainMenu.id,
      categoryId: dessertCategory.id,
      dietary: {
        connect: [{ id: vegetarianTag.id }],
      },
    },
  });

  const chocolateLava = await prisma.menuItem.create({
    data: {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with a molten center, served with vanilla ice cream',
      price: 9.99,
      image: 'https://images.unsplash.com/photo-1617303273451-ca7cad656d76?q=80&w=500',
      isAvailable: true,
      isVegetarian: true,
      menuId: mainMenu.id,
      categoryId: dessertCategory.id,
      dietary: {
        connect: [{ id: vegetarianTag.id }],
      },
    },
  });

  // Drinks
  const wine = await prisma.menuItem.create({
    data: {
      name: 'House Red Wine',
      description: 'Glass of our premium house red wine',
      price: 8.99,
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=500',
      isAvailable: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      isDairyFree: true,
      menuId: mainMenu.id,
      categoryId: drinksCategory.id,
      dietary: {
        connect: [{ id: vegetarianTag.id }, { id: veganTag.id }, { id: glutenFreeTag.id }, { id: dairyFreeTag.id }],
      },
    },
  });

  console.log('Created menu items');

  // Create some bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.booking.create({
    data: {
      customerName: 'John Customer',
      email: customer.email,
      phone: customer.phone!,
      partySize: 2,
      bookingTime: tomorrow,
      specialRequest: 'Window seat if possible',
      status: 'confirmed',
      tableId: tables[0].id,
      userId: customer.id,
    },
  });

  await prisma.booking.create({
    data: {
      customerName: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '555-123-4567',
      partySize: 4,
      bookingTime: nextWeek,
      specialRequest: 'Celebrating a birthday',
      status: 'pending',
      tableId: tables[1].id,
    },
  });

  console.log('Created bookings');

  // Create some orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      total: 46.97,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'Credit Card',
      orderType: 'DINE_IN',
      userId: customer.id,
      items: {
        create: [
          {
            quantity: 1,
            price: bruschetta.price,
            menuItemId: bruschetta.id,
          },
          {
            quantity: 1,
            price: steak.price,
            menuItemId: steak.id,
          },
          {
            quantity: 1,
            price: wine.price,
            menuItemId: wine.id,
          },
        ],
      },
      statusUpdates: {
        create: [
          {
            status: 'PENDING',
            updatedById: admin.id,
          },
          {
            status: 'CONFIRMED',
            updatedById: admin.id,
          },
          {
            status: 'PREPARING',
            updatedById: chef.id,
          },
          {
            status: 'COMPLETED',
            updatedById: waiter.id,
          },
        ],
      },
    },
  });

  const pendingOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-002',
      total: 33.98,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      orderType: 'PICKUP',
      userId: customer.id,
      items: {
        create: [
          {
            quantity: 2,
            price: pastaVegetable.price,
            menuItemId: pastaVegetable.id,
          },
          {
            quantity: 1,
            price: tiramisu.price,
            menuItemId: tiramisu.id,
          },
        ],
      },
      statusUpdates: {
        create: [
          {
            status: 'PENDING',
            updatedById: admin.id,
          },
        ],
      },
    },
  });

  console.log('Created orders');

  // Create reviews
  await prisma.review.create({
    data: {
      rating: 5,
      title: 'Amazing dish!',
      content: 'The steak was cooked to perfection. Will definitely order again!',
      userId: customer.id,
      menuItemId: steak.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      title: 'Great appetizer',
      content: 'Delicious bruschetta, very fresh ingredients',
      userId: customer.id,
      menuItemId: bruschetta.id,
    },
  });

  console.log('Created reviews');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 