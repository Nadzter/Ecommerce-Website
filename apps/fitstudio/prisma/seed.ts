import {
  BookingStatus,
  ClassLocation,
  Currency,
  PrismaClient,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed the database with two demo tenants so a fresh checkout has something
 * to render in the dashboard and the member portal. Re-running the script
 * upserts by stable keys (slug, clerkId, invoiceNumber) so it is idempotent.
 */
async function main(): Promise<void> {
  const acme = await prisma.studio.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      slug: "acme",
      name: "Acme Pilates Madrid",
      primaryColor: "#1E293B",
      timezone: "Europe/Madrid",
      currency: Currency.EUR,
      country: "ES",
      language: "es",
      vatNumber: "ESB12345678",
      verifactuEnabled: true,
    },
  });

  const dunes = await prisma.studio.upsert({
    where: { slug: "dunes" },
    update: {},
    create: {
      slug: "dunes",
      name: "Dunes Yoga Dubai",
      primaryColor: "#B45309",
      timezone: "Asia/Dubai",
      currency: Currency.AED,
      country: "AE",
      language: "en",
    },
  });

  const owner = await prisma.user.upsert({
    where: { clerkId: "seed_owner_acme" },
    update: {},
    create: {
      clerkId: "seed_owner_acme",
      email: "owner@acme.test",
      firstName: "Lucía",
      lastName: "García",
      role: UserRole.OWNER,
      language: "es",
      studioId: acme.id,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { clerkId: "seed_staff_acme" },
    update: {},
    create: {
      clerkId: "seed_staff_acme",
      email: "ines@acme.test",
      firstName: "Inés",
      lastName: "Martín",
      role: UserRole.STAFF,
      language: "es",
      studioId: acme.id,
    },
  });

  const member = await prisma.user.upsert({
    where: { clerkId: "seed_member_acme" },
    update: {},
    create: {
      clerkId: "seed_member_acme",
      email: "member@acme.test",
      firstName: "Carla",
      lastName: "Pérez",
      role: UserRole.MEMBER,
      language: "es",
      studioId: acme.id,
    },
  });

  // Schedule three classes starting in the next few days.
  const now = new Date();
  const sessions = [
    {
      offsetHours: 24,
      title: "Reformer Pilates",
      description: "Slow-burn reformer flow for all levels.",
      capacity: 12,
      location: ClassLocation.INPERSON,
    },
    {
      offsetHours: 48,
      title: "Vinyasa Flow",
      description: "Energetic vinyasa with a focus on hips and shoulders.",
      capacity: 20,
      location: ClassLocation.HYBRID,
    },
    {
      offsetHours: 72,
      title: "Strength & Conditioning",
      description: "Functional strength circuit with dumbbells.",
      capacity: 16,
      location: ClassLocation.INPERSON,
    },
  ];

  for (const session of sessions) {
    const start = new Date(now.getTime() + session.offsetHours * 3_600_000);
    const end = new Date(start.getTime() + 55 * 60_000);
    await prisma.class.upsert({
      where: {
        // Composite uniqueness isn't declared, so emulate via title+start.
        id: `seed-${acme.id}-${session.title.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: { startTime: start, endTime: end },
      create: {
        id: `seed-${acme.id}-${session.title.toLowerCase().replace(/\s+/g, "-")}`,
        studioId: acme.id,
        title: session.title,
        description: session.description,
        instructorId: instructor.id,
        startTime: start,
        endTime: end,
        capacity: session.capacity,
        location: session.location,
      },
    });
  }

  // One confirmed booking for the member on the first class.
  const firstClass = await prisma.class.findFirst({
    where: { studioId: acme.id },
    orderBy: { startTime: "asc" },
  });
  if (firstClass) {
    await prisma.booking.upsert({
      where: {
        classId_userId: { classId: firstClass.id, userId: member.id },
      },
      update: { status: BookingStatus.CONFIRMED },
      create: {
        studioId: acme.id,
        classId: firstClass.id,
        userId: member.id,
        status: BookingStatus.CONFIRMED,
        creditsUsed: 1,
      },
    });
  }

  console.log(
    `Seeded studios: ${acme.slug}, ${dunes.slug} (owner=${owner.email})`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
