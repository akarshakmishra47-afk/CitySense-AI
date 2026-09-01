const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const adminEmail = 'Admin123@';
  const adminPassword = await bcrypt.hash('123456', 10);

  // Find any existing admin user to replace, or just update by role.
  // Actually, we'll just upsert on the new email and delete the old admin@example.com
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: adminPassword, role: 'admin' },
    create: {
      name: 'System Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    }
  });

  // Delete the old demo admin if it exists
  try {
    await prisma.user.delete({
      where: { email: 'admin@example.com' }
    });
    console.log("Deleted old admin@example.com");
  } catch (e) {
    // Ignore if it doesn't exist
  }

  console.log("Admin credentials successfully updated.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
