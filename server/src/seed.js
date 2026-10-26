import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User, Product } from "./server.js";
dotenv.config();
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pugazh_nila";
const products = [
  { name: "Emerald Kanjivaram Silk Saree", sku: "PN-SAR-001", category: "Sarees", description: "A statement silk saree for celebrations, finished with a traditional gold-tone border.", price: 12990, salePrice: 11990, images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85"], colors: ["Emerald", "Wine"], sizes: ["Free Size"], stock: 8, fabric: "Silk blend", occasion: "Wedding", featured: true, bestseller: true },
  { name: "Ivory Embroidered Anarkali", sku: "PN-SAL-002", category: "Salwar Suits", description: "An elegant ivory festive silhouette with delicate embroidery details.", price: 6490, images: ["https://images.unsplash.com/photo-1583391733956-6c78276477e8?auto=format&fit=crop&w=900&q=85"], colors: ["Ivory"], sizes: ["S", "M", "L", "XL"], stock: 12, fabric: "Georgette", occasion: "Festive", featured: true },
  { name: "Burgundy Celebration Lehenga", sku: "PN-LEH-003", category: "Lehengas", description: "A rich burgundy occasion set designed for memorable evenings.", price: 18990, images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85"], colors: ["Burgundy"], sizes: ["S", "M", "L"], stock: 4, fabric: "Silk blend", occasion: "Wedding", bestseller: true },
  { name: "Forest Green Everyday Kurti", sku: "PN-KUR-004", category: "Kurtis", description: "A versatile, comfortable kurti in a deep forest-green shade.", price: 1890, images: ["https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=900&q=85"], colors: ["Forest Green", "Black"], sizes: ["S", "M", "L", "XL", "XXL"], stock: 25, fabric: "Cotton", occasion: "Everyday", featured: true },
  { name: "Champagne Gold Festive Blouse", sku: "PN-BLO-005", category: "Blouses", description: "A refined blouse with subtle festive detailing, suitable for pairing with silk sarees.", price: 3290, images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=900&q=85"], colors: ["Champagne Gold"], sizes: ["S", "M", "L", "XL"], stock: 10, fabric: "Silk blend", occasion: "Festive" },
  { name: "Classic Linen Men's Kurta", sku: "PN-MEN-006", category: "Men's Wear", description: "A clean-lined kurta for celebrations and relaxed occasions.", price: 2490, images: ["https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85"], colors: ["Ivory", "Green"], sizes: ["S", "M", "L", "XL"], stock: 16, fabric: "Linen blend", occasion: "Festive" },
  { name: "Little Bloom Kids Festive Set", sku: "PN-KID-007", category: "Kidswear", description: "A joyful festive outfit for little celebrations.", price: 2190, images: ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=85"], colors: ["Gold", "Rose"], sizes: ["2Y", "4Y", "6Y", "8Y"], stock: 9, fabric: "Cotton blend", occasion: "Celebration" },
  { name: "Custom Stitching Consultation", sku: "PN-CUS-008", category: "Custom Stitching", description: "Start a bespoke garment request and our team will confirm pricing and timeline.", price: 0, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=85"], colors: [], sizes: ["Custom"], stock: 99, fabric: "Customer selected", occasion: "Custom" }
];
try {
  await mongoose.connect(uri);
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
    await User.updateOne({ email }, { $setOnInsert: { name: "PUGAZH NILA Admin", email, passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12), role: "admin" } }, { upsert: true });
    console.log("Admin account ensured for configured SEED_ADMIN_EMAIL.");
  } else console.log("Admin account skipped: configure SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env.");
  for (const p of products) await Product.updateOne({ sku: p.sku }, { $setOnInsert: p }, { upsert: true });
  console.log("Seed products ensured.");
} catch (e) { console.error(e.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
