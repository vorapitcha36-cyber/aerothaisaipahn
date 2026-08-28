import { PrismaClient, LocationType, Region, Role, UserStatus } from "@prisma/client";
import { CATEGORY_SEEDS } from "@aerothai/shared";

const prisma = new PrismaClient();

const centers = [
  ["CNX", "เชียงใหม่", Region.NORTH, 18.7668, 98.9626],
  ["UDN", "อุดรธานี", Region.NORTHEAST, 17.3864, 102.7882],
  ["KOR", "นครราชสีมา", Region.NORTHEAST, 14.9495, 102.3127],
  ["PHS", "พิษณุโลก", Region.CENTRAL, 16.7829, 100.2791],
  ["URT", "สุราษฎร์ธานี", Region.SOUTH, 9.1326, 99.1356],
  ["HHQ", "หัวหิน", Region.CENTRAL, 12.6362, 99.9515],
  ["HKT", "ภูเก็ต", Region.SOUTH, 8.1132, 98.3169],
  ["HDY", "หาดใหญ่", Region.SOUTH, 6.9327, 100.393],
  ["MAQ", "แม่สอด", Region.NORTH, 16.6999, 98.5451]
] as const;

async function main() {
  for (const [index, category] of CATEGORY_SEEDS.entries()) {
    await prisma.category.upsert({
      where: { code: category.code },
      update: { nameTh: category.nameTh, sortOrder: index + 1, active: true },
      create: { ...category, sortOrder: index + 1 }
    });
  }

  const parents = [];
  for (const [code, name, region, latitude, longitude] of centers) {
    parents.push(await prisma.location.upsert({
      where: { code },
      update: { nameTh: `ศูนย์ควบคุมการบิน${name}`, region, latitude, longitude, active: true },
      create: { code, nameTh: `ศูนย์ควบคุมการบิน${name}`, type: LocationType.CENTER, region, latitude, longitude }
    }));
  }

  for (let i = 0; i < 23; i += 1) {
    const parent = parents[i % parents.length];
    await prisma.location.upsert({
      where: { code: `TWR-${String(i + 1).padStart(2, "0")}` },
      update: { parentId: parent.id, active: true },
      create: {
        code: `TWR-${String(i + 1).padStart(2, "0")}`,
        nameTh: `หอควบคุมการบินตัวอย่าง ${i + 1}`,
        type: LocationType.OUTSTATION,
        region: parent.region,
        latitude: Number(parent.latitude) + ((i % 4) - 1.5) * 0.35,
        longitude: Number(parent.longitude) + ((i % 3) - 1) * 0.35,
        parentId: parent.id
      }
    });
  }

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: Role.ADMIN, status: UserStatus.ACTIVE },
      create: { email: adminEmail, displayName: "ผู้ดูแลระบบ", role: Role.ADMIN, status: UserStatus.ACTIVE, approvedAt: new Date() }
    });
  }
}

main().finally(() => prisma.$disconnect());
