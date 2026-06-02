import {
  BillingInterval,
  BookingStatus,
  ClassLocation,
  Currency,
  MembershipType,
  PrismaClient,
  SessionType,
  UserRole,
} from "@/prisma/generated/client";

const prisma = new PrismaClient();

/**
 * Seed the database with two demo tenants so a fresh checkout has something
 * to render in the dashboard and the member portal. Re-running the script
 * upserts by stable keys (slug, clerkId, deterministic ids) so it is
 * idempotent.
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
      vatRate: "21.00",
      verifactuEnabled: true,
      address: "Calle Velázquez 12, 28001 Madrid",
      email: "hola@acme-pilates.test",
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
      vatRate: "5.00",
      address: "DIFC, Gate Avenue, Dubai",
      email: "hi@dunes-yoga.test",
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
    update: { creditsBalance: 8 },
    create: {
      clerkId: "seed_member_acme",
      email: "member@acme.test",
      firstName: "Carla",
      lastName: "Pérez",
      role: UserRole.MEMBER,
      language: "es",
      studioId: acme.id,
      creditsBalance: 8,
      dni: "12345678Z",
    },
  });

  // Membership templates the studio offers.
  const tenPack = await prisma.membership.upsert({
    where: { id: `seed-${acme.id}-pack` },
    update: {},
    create: {
      id: `seed-${acme.id}-pack`,
      studioId: acme.id,
      name: "10-class pack",
      description: "Use within 90 days.",
      type: MembershipType.CLASS_PACK,
      classCount: 10,
      price: "120.00",
      currency: Currency.EUR,
      billingInterval: BillingInterval.ONE_TIME,
    },
  });

  await prisma.membership.upsert({
    where: { id: `seed-${acme.id}-unlimited` },
    update: {},
    create: {
      id: `seed-${acme.id}-unlimited`,
      studioId: acme.id,
      name: "Unlimited monthly",
      description: "All group classes, billed monthly.",
      type: MembershipType.UNLIMITED,
      price: "149.00",
      currency: Currency.EUR,
      billingInterval: BillingInterval.MONTHLY,
    },
  });

  // Active 10-pack subscription for the seed member so booking works.
  await prisma.userMembership.upsert({
    where: { id: `seed-${acme.id}-${member.id}-um` },
    update: {},
    create: {
      id: `seed-${acme.id}-${member.id}-um`,
      studioId: acme.id,
      userId: member.id,
      membershipId: tenPack.id,
      creditsRemaining: null,
      isActive: true,
    },
  });

  // Schedule three classes starting in the next few days.
  const now = new Date();
  const sessions: Array<{
    offsetHours: number;
    title: string;
    description: string;
    capacity: number;
    location: ClassLocation;
    sessionType: SessionType;
    equipment: string[];
  }> = [
    {
      offsetHours: 24,
      title: "Reformer Pilates",
      description: "Slow-burn reformer flow for all levels.",
      capacity: 6,
      location: ClassLocation.INPERSON,
      sessionType: SessionType.GROUP,
      equipment: ["Reformer 1", "Reformer 2", "Reformer 3"],
    },
    {
      offsetHours: 48,
      title: "Vinyasa Flow",
      description: "Energetic vinyasa with a focus on hips and shoulders.",
      capacity: 20,
      location: ClassLocation.HYBRID,
      sessionType: SessionType.GROUP,
      equipment: [],
    },
    {
      offsetHours: 72,
      title: "Private Reformer",
      description: "1:1 reformer coaching.",
      capacity: 1,
      location: ClassLocation.INPERSON,
      sessionType: SessionType.PRIVATE,
      equipment: ["Reformer 1"],
    },
  ];

  for (const session of sessions) {
    const start = new Date(now.getTime() + session.offsetHours * 3_600_000);
    const end = new Date(start.getTime() + 55 * 60_000);
    const id = `seed-${acme.id}-${session.title
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    await prisma.class.upsert({
      where: { id },
      update: { startTime: start, endTime: end },
      create: {
        id,
        studioId: acme.id,
        title: session.title,
        description: session.description,
        instructorId: instructor.id,
        startTime: start,
        endTime: end,
        capacity: session.capacity,
        location: session.location,
        sessionType: session.sessionType,
        equipment: session.equipment,
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
