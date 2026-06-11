import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding...");

  const store = await db.store.upsert({
    where: { id: "store-demo" },
    update: {},
    create: {
      id: "store-demo",
      name: "Pamonharia da Dona Maria",
      phone: "(11) 99999-9999",
      address: "Rua das Pamonhas, 123 - Jundiaí-SP",
      cmvTarget: 30,
      defaultMarkup: 70,
    },
  });

  const password = await bcrypt.hash("admin123", 10);

  const user = await db.user.upsert({
    where: { email: "admin@pamonharia.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@pamonharia.com",
      password,
      role: "admin",
      storeId: store.id,
    },
  });

  // Categorias
  const catDoce = await db.category.upsert({
    where: { id: "cat-doce" },
    update: {},
    create: { id: "cat-doce", name: "Doce", color: "#f59e0b", storeId: store.id },
  });
  const catSalgado = await db.category.upsert({
    where: { id: "cat-salgado" },
    update: {},
    create: { id: "cat-salgado", name: "Salgado", color: "#f97316", storeId: store.id },
  });

  // Insumos
  const milho = await db.ingredient.upsert({
    where: { id: "ing-milho" },
    update: {},
    create: {
      id: "ing-milho", storeId: store.id, name: "Milho verde",
      unit: "kg", stockQty: 50, minStock: 10, costPerUnit: 2.50,
    },
  });
  const acucar = await db.ingredient.upsert({
    where: { id: "ing-acucar" },
    update: {},
    create: {
      id: "ing-acucar", storeId: store.id, name: "Açúcar",
      unit: "kg", stockQty: 20, minStock: 5, costPerUnit: 4.00,
    },
  });
  const sal = await db.ingredient.upsert({
    where: { id: "ing-sal" },
    update: {},
    create: {
      id: "ing-sal", storeId: store.id, name: "Sal",
      unit: "kg", stockQty: 5, minStock: 1, costPerUnit: 1.80,
    },
  });
  const queijo = await db.ingredient.upsert({
    where: { id: "ing-queijo" },
    update: {},
    create: {
      id: "ing-queijo", storeId: store.id, name: "Queijo minas",
      unit: "kg", stockQty: 8, minStock: 2, costPerUnit: 22.00,
    },
  });
  const palha = await db.ingredient.upsert({
    where: { id: "ing-palha" },
    update: {},
    create: {
      id: "ing-palha", storeId: store.id, name: "Palha de milho",
      unit: "un", stockQty: 500, minStock: 100, costPerUnit: 0.10,
    },
  });

  // Produtos
  const pamDoce = await db.product.upsert({
    where: { id: "prod-doce" },
    update: {},
    create: {
      id: "prod-doce", storeId: store.id, categoryId: catDoce.id,
      name: "Pamonha Doce", salePrice: 8.00, tipoProducao: "unitario",
    },
  });
  const pamSalgada = await db.product.upsert({
    where: { id: "prod-salgada" },
    update: {},
    create: {
      id: "prod-salgada", storeId: store.id, categoryId: catSalgado.id,
      name: "Pamonha Salgada", salePrice: 9.00, tipoProducao: "unitario",
    },
  });
  const pamQueijo = await db.product.upsert({
    where: { id: "prod-queijo" },
    update: {},
    create: {
      id: "prod-queijo", storeId: store.id, categoryId: catSalgado.id,
      name: "Pamonha com Queijo", salePrice: 12.00, tipoProducao: "unitario",
    },
  });
  const cural = await db.product.upsert({
    where: { id: "prod-cural" },
    update: {},
    create: {
      id: "prod-cural", storeId: store.id, categoryId: catDoce.id,
      name: "Curau", salePrice: 6.00, tipoProducao: "unitario",
    },
  });

  // Fichas técnicas
  await db.productIngredient.deleteMany({ where: { productId: pamDoce.id } });
  await db.productIngredient.createMany({ data: [
    { productId: pamDoce.id, ingredientId: milho.id, qtyPerUnit: 0.25 },
    { productId: pamDoce.id, ingredientId: acucar.id, qtyPerUnit: 0.05 },
    { productId: pamDoce.id, ingredientId: palha.id, qtyPerUnit: 2 },
  ]});

  await db.productIngredient.deleteMany({ where: { productId: pamSalgada.id } });
  await db.productIngredient.createMany({ data: [
    { productId: pamSalgada.id, ingredientId: milho.id, qtyPerUnit: 0.25 },
    { productId: pamSalgada.id, ingredientId: sal.id, qtyPerUnit: 0.01 },
    { productId: pamSalgada.id, ingredientId: palha.id, qtyPerUnit: 2 },
  ]});

  await db.productIngredient.deleteMany({ where: { productId: pamQueijo.id } });
  await db.productIngredient.createMany({ data: [
    { productId: pamQueijo.id, ingredientId: milho.id, qtyPerUnit: 0.25 },
    { productId: pamQueijo.id, ingredientId: queijo.id, qtyPerUnit: 0.05 },
    { productId: pamQueijo.id, ingredientId: palha.id, qtyPerUnit: 2 },
  ]});

  await db.productIngredient.deleteMany({ where: { productId: cural.id } });
  await db.productIngredient.createMany({ data: [
    { productId: cural.id, ingredientId: milho.id, qtyPerUnit: 0.20 },
    { productId: cural.id, ingredientId: acucar.id, qtyPerUnit: 0.04 },
  ]});

  // Config de IA
  await db.aiConfig.upsert({
    where: { storeId: store.id },
    update: {},
    create: {
      storeId: store.id,
      provider: "google",
      model: "gemini-2.0-flash",
      temperature: 0.7,
      maxTokens: 1024,
    },
  });

  console.log("✅ Seed concluído!");
  console.log(`   Loja: ${store.name}`);
  console.log(`   Login: admin@pamonharia.com / admin123`);
}

main().catch(console.error).finally(() => db.$disconnect());
