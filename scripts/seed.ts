import { db } from "../server/db";
import { users, products, shippingOptions, paypalSettings } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Starting seed...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@cara.pt";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminFirstName = process.env.ADMIN_FIRST_NAME || "Administrador";
  const adminLastName = process.env.ADMIN_LAST_NAME || "CARA";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, adminEmail),
  });

  if (!existingAdmin) {
    await db.insert(users).values({
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
    await db.update(users)
      .set({
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        status: "approved",
        role: "admin",
      })
      .where(eq(users.email, adminEmail));
    console.log(`Admin user updated: ${adminEmail}`);
  }

  const existingProducts = await db.query.products.findFirst();
  if (!existingProducts) {
    await db.insert(products).values([
      {
        name: "CARA Light",
        slug: "cara-light",
        description: "Preenchedor de ácido hialurónico com lidocaína para rugas finas e linhas superficiais.",
        shortDescription: "Ideal para rugas finas e superficiais",
        price: "89.00",
        particleSize: "Pequenas (100-200μm)",
        needleSize: "30G",
        injectionDepth: "Derme superficial",
        applicationZones: "Rugas periorbitais, linhas finas, hidratação labial",
        inStock: true,
        isActive: true,
        promotionRules: [
          { minQuantity: 5, pricePerUnit: "85.00" },
          { minQuantity: 10, pricePerUnit: "80.00" },
        ],
      },
      {
        name: "CARA Medium",
        slug: "cara-medium",
        description: "Preenchedor versátil para rugas moderadas e volumização facial.",
        shortDescription: "Para rugas moderadas e volume",
        price: "129.00",
        particleSize: "Médias (200-400μm)",
        needleSize: "27G",
        injectionDepth: "Derme média",
        applicationZones: "Sulcos nasogenianos, rugas marionete, volumização labial",
        inStock: true,
        isActive: true,
        promotionRules: [
          { minQuantity: 5, pricePerUnit: "120.00" },
          { minQuantity: 10, pricePerUnit: "115.00" },
        ],
      },
      {
        name: "CARA Deep",
        slug: "cara-deep",
        description: "Preenchedor de alta densidade para restauração de volume e contorno facial.",
        shortDescription: "Restauração de volume profundo",
        price: "159.00",
        particleSize: "Grandes (400-600μm)",
        needleSize: "25G",
        injectionDepth: "Derme profunda / Subcutâneo",
        applicationZones: "Maçãs do rosto, queixo, mandíbula, volumização profunda",
        inStock: true,
        isActive: true,
        promotionRules: [
          { minQuantity: 5, pricePerUnit: "150.00" },
          { minQuantity: 10, pricePerUnit: "145.00" },
        ],
      },
    ]);
    console.log("Sample products created");
  } else {
    console.log("Products already exist, skipping...");
  }

  const existingShipping = await db.query.shippingOptions.findFirst();
  if (!existingShipping) {
    await db.insert(shippingOptions).values([
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
    await db.insert(paypalSettings).values({
      id: "default",
      mode: "sandbox",
      isEnabled: false,
    });
    console.log("PayPal settings initialized");
  } else {
    console.log("PayPal settings already exist, skipping...");
  }

  console.log("Seed completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
