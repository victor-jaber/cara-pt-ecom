import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import * as schema from "../shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Starting seed...");

  // Run migrations for production compatibility
  console.log("Running schema migrations...");
  try {
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR`);
    console.log("Migration: category column ensured");
  } catch (err) {
    console.log("Migration note: category column already exists or migration skipped");
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@cara.pt";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminFirstName = process.env.ADMIN_FIRST_NAME || "Administrador";
  const adminLastName = process.env.ADMIN_LAST_NAME || "CARA";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, adminEmail),
  });

  if (!existingAdmin) {
    await db.insert(schema.users).values({
      email: adminEmail,
      passwordHash,
      firstName: adminFirstName,
      lastName: adminLastName,
      phone: "+351000000000",
      profession: "Administrador",
      status: "approved",
      role: "admin",
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    await db.update(schema.users)
      .set({
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        status: "approved",
        role: "admin",
      })
      .where(eq(schema.users.email, adminEmail));
    console.log(`Admin user updated: ${adminEmail}`);
  }

  const existingProducts = await db.query.products.findFirst();
  if (!existingProducts) {
    await db.insert(schema.products).values([
      {
        name: "CARA Soft",
        slug: "cara-soft",
        category: "soft",
        description: "Ácido hialurónico de partículas finas para correção de rugas superficiais e hidratação profunda da pele. Ideal para tratamentos de rejuvenescimento facial delicado.",
        shortDescription: "Rugas superficiais e hidratação profunda",
        price: "145.00",
        particleSize: "0.2-0.3mm",
        needleSize: "30G",
        injectionDepth: "Dérmica superficial",
        applicationZones: "Linhas periorais, região periocular, pescoço",
        infodmCode: "CE2797",
        inStock: true,
        isActive: true,
        promotionRules: [
          { minQuantity: 10, pricePerUnit: "130.00" },
        ],
      },
      {
        name: "CARA Mild",
        slug: "cara-mild",
        category: "mild",
        description: "Fórmula equilibrada para preenchimento de rugas moderadas e restauração de volume em áreas médias do rosto. Excelente para sulcos nasogenianos leves.",
        shortDescription: "Rugas moderadas e restauração de volume",
        price: "165.00",
        particleSize: "0.4-0.5mm",
        needleSize: "27G",
        injectionDepth: "Dérmica média",
        applicationZones: "Sulcos nasogenianos, contorno facial, mãos",
        infodmCode: "CE2797",
        inStock: true,
        isActive: true,
        promotionRules: [
          { minQuantity: 10, pricePerUnit: "150.00" },
        ],
      },
      {
        name: "CARA Hard",
        slug: "cara-hard",
        category: "hard",
        description: "Gel coeso de alta densidade para correção de rugas profundas e restauração significativa de volume facial. Perfeito para sulcos profundos e contorno mandibular.",
        shortDescription: "Rugas profundas e volume facial significativo",
        price: "185.00",
        particleSize: "0.8-1.0mm",
        needleSize: "25G",
        injectionDepth: "Dérmica profunda a subcutânea",
        applicationZones: "Mandíbula, queixo, maçãs do rosto",
        infodmCode: "CE2797",
        inStock: true,
        isActive: true,
        promotionRules: [
          { minQuantity: 10, pricePerUnit: "170.00" },
        ],
      },
      {
        name: "CARA Ultra",
        slug: "cara-ultra",
        category: "ultra",
        description: "Formulação premium de máxima densidade para volumização intensa e escultura facial. Ideal para aumento de volume em zigomáticos e remodelagem facial completa.",
        shortDescription: "Volumização máxima e escultura facial",
        price: "210.00",
        particleSize: "1.2-1.4mm",
        needleSize: "23G",
        injectionDepth: "Subcutânea profunda",
        applicationZones: "Zigomáticos, mandíbula, glúteos, mãos",
        infodmCode: "CE2797",
        inStock: true,
        isActive: true,
        promotionRules: [
          { minQuantity: 10, pricePerUnit: "195.00" },
        ],
      },
    ]);
    console.log("Sample products created (CARA Soft, Mild, Hard, Ultra)");
  } else {
    console.log("Products already exist, skipping...");
  }

  const existingShipping = await db.query.shippingOptions.findFirst();
  if (!existingShipping) {
    await db.insert(schema.shippingOptions).values([
      {
        name: "Envio Standard",
        description: "Entrega em 3-5 dias úteis",
        price: "5.99",
        estimatedDays: "3-5 dias úteis",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Envio Expresso",
        description: "Entrega em 1-2 dias úteis",
        price: "12.99",
        estimatedDays: "1-2 dias úteis",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Envio Grátis",
        description: "Para pedidos acima de 500€",
        price: "0.00",
        estimatedDays: "3-5 dias úteis",
        isActive: true,
        sortOrder: 0,
      },
    ]);
    console.log("Shipping options created");
  } else {
    console.log("Shipping options already exist, skipping...");
  }

  const existingPaypal = await db.query.paypalSettings.findFirst();
  if (!existingPaypal) {
    await db.insert(schema.paypalSettings).values({
      id: "default",
      mode: "sandbox",
      isEnabled: false,
    });
    console.log("PayPal settings initialized");
  } else {
    console.log("PayPal settings already exist, skipping...");
  }

  console.log("Seed completed successfully!");
  await pool.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
