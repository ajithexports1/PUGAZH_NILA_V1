import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import Razorpay from "razorpay";

dotenv.config();
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

const { Schema, model } = mongoose;
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["customer", "admin"], default: "customer" }
}, { timestamps: true });

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true, index: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0 },
  images: [{ type: String }],
  colors: [{ type: String }],
  sizes: [{ type: String }],
  stock: { type: Number, default: 0, min: 0 },
  fabric: { type: String, default: "" },
  care: { type: String, default: "Dry clean or follow garment label." },
  occasion: { type: String, default: "Everyday" },
  featured: { type: Boolean, default: false },
  bestseller: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: [{ product: { type: Schema.Types.ObjectId, ref: "Product" }, name: String, sku: String, size: String, color: String, quantity: Number, unitPrice: Number }],
  address: { name: String, phone: String, email: String, line1: String, city: String, state: String, pincode: String, instructions: String },
  subtotal: Number, shipping: Number, total: Number,
  status: { type: String, enum: ["pending_payment", "placed", "processing", "shipped", "delivered", "cancelled"], default: "pending_payment" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  paymentProvider: { type: String, default: "manual_or_gateway" },
  paymentReference: String
}, { timestamps: true });

const stitchingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  garmentType: { type: String, required: true },
  fabric: String,
  sizeMode: { type: String, enum: ["standard", "measurements"], default: "standard" },
  size: String,
  measurements: { type: Map, of: String },
  instructions: String,
  status: { type: String, enum: ["requested", "quoted", "approved", "in_progress", "ready", "completed", "cancelled"], default: "requested" }
}, { timestamps: true });

const User = model("User", userSchema);
const Product = model("Product", productSchema);
const Order = model("Order", orderSchema);
const StitchingRequest = model("StitchingRequest", stitchingSchema);

const safeUser = u => ({ id: u._id, name: u.name, email: u.email, role: u.role });
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Please sign in to continue." });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Your session has expired. Please sign in again." }); }
}
function admin(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Administrator access required." });
  next();
}
const sign = u => jwt.sign({ id: String(u._id), role: u.role, email: u.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

app.get("/api/products", async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
    if (req.query.q) filter.name = { $regex: String(req.query.q).slice(0, 80), $options: "i" };
    if (req.query.featured === "true") filter.featured = true;
    const sortMap = { newest: { createdAt: -1 }, low: { price: 1 }, high: { price: -1 }, popular: { bestseller: -1, createdAt: -1 } };
    const products = await Product.find(filter).sort(sortMap[req.query.sort] || sortMap.newest).limit(100);
    res.json(products);
  } catch (e) { next(e); }
});
app.get("/api/products/:id", async (req, res, next) => {
  try {
    const p = await Product.findOne({ _id: req.params.id, active: true });
    if (!p) return res.status(404).json({ message: "Product not found." });
    res.json(p);
  } catch (e) { next(e); }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "") || typeof password !== "string" || password.length < 8)
      return res.status(400).json({ message: "Enter your name, a valid email, and a password with at least 8 characters." });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: "An account with this email already exists." });
    const u = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: sign(u), user: safeUser(u) });
  } catch (e) { next(e); }
});
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const u = await User.findOne({ email: String(req.body?.email || "").toLowerCase() });
    if (!u || !(await bcrypt.compare(req.body?.password || "", u.passwordHash))) return res.status(401).json({ message: "Email or password is incorrect." });
    res.json({ token: sign(u), user: safeUser(u) });
  } catch (e) { next(e); }
});
app.get("/api/auth/me", auth, async (req, res, next) => {
  try { const u = await User.findById(req.user.id); if (!u) return res.status(401).json({ message: "Account not found." }); res.json(safeUser(u)); }
  catch (e) { next(e); }
});

app.post("/api/orders", auth, async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { items, address } = req.body || {};
    if (!Array.isArray(items) || !items.length || items.length > 30) return res.status(400).json({ message: "Your cart is empty or contains too many items." });
    const required = ["name", "phone", "email", "line1", "city", "state", "pincode"];
    if (!address || required.some(k => !String(address[k] || "").trim())) return res.status(400).json({ message: "Complete all required delivery address fields." });
    if (!/^\d{6}$/.test(String(address.pincode))) return res.status(400).json({ message: "Enter a valid 6-digit Indian pincode." });
    let order;
    await session.withTransaction(async () => {
      let subtotal = 0; const checked = [];
      for (const item of items) {
        const product = await Product.findOne({ _id: item.productId, active: true }).session(session);
        const qty = Number(item.quantity);
        if (!product || !Number.isInteger(qty) || qty < 1) throw Object.assign(new Error("A cart item is invalid."), { status: 400 });
        if (product.stock < qty) throw Object.assign(new Error(`${product.name} does not have enough stock.`), { status: 409 });
        const unitPrice = product.salePrice != null ? product.salePrice : product.price;
        subtotal += unitPrice * qty;
        checked.push({ product, qty, unitPrice, size: String(item.size || ""), color: String(item.color || "") });
      }
      for (const item of checked) {
        const result = await Product.updateOne({ _id: item.product._id, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } }, { session });
        if (result.modifiedCount !== 1) throw Object.assign(new Error("Stock changed while checking out. Please retry."), { status: 409 });
      }
      const shipping = subtotal >= 2500 ? 0 : 99;
      order = await Order.create([{
        user: req.user.id,
        items: checked.map(i => ({ product: i.product._id, name: i.product.name, sku: i.product.sku, size: i.size, color: i.color, quantity: i.qty, unitPrice: i.unitPrice })),
        address, subtotal, shipping, total: subtotal + shipping, status: "pending_payment", paymentStatus: "pending"
      }], { session });
      order = order[0];
    });
    res.status(201).json(order);
  } catch (e) { next(e); } finally { await session.endSession(); }
});
app.get("/api/orders/mine", auth, async (req, res, next) => {
  try { res.json(await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50)); } catch (e) { next(e); }
});
app.post("/api/stitching", auth, async (req, res, next) => {
  try {
    const { garmentType, fabric, sizeMode, size, measurements, instructions } = req.body || {};
    if (!garmentType?.trim()) return res.status(400).json({ message: "Select a garment type." });
    const request = await StitchingRequest.create({ user: req.user.id, garmentType, fabric, sizeMode, size, measurements, instructions });
    res.status(201).json({ message: "Stitching request received. The boutique will confirm your quote and timeline.", request });
  } catch (e) { next(e); }
});

app.get("/api/admin/summary", auth, admin, async (_req, res, next) => {
  try {
    const [products, orders, customers, revenue] = await Promise.all([
      Product.countDocuments(), Order.countDocuments(), User.countDocuments({ role: "customer" }),
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }])
    ]);
    res.json({ products, orders, customers, revenue: revenue[0]?.total || 0 });
  } catch (e) { next(e); }
});
app.post("/api/admin/products", auth, admin, async (req, res, next) => {
  try { const p = await Product.create(req.body); res.status(201).json(p); } catch (e) { next(e); }
});
app.patch("/api/admin/products/:id", auth, admin, async (req, res, next) => {
  try { const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!p) return res.status(404).json({ message: "Product not found." }); res.json(p); } catch (e) { next(e); }
});
app.get("/api/admin/orders", auth, admin, async (_req, res, next) => {
  try { res.json(await Order.find().sort({ createdAt: -1 }).limit(200).populate("user", "name email")); } catch (e) { next(e); }
});
app.patch("/api/admin/orders/:id/status", auth, admin, async (req, res, next) => {
  try {
    const allowed = ["placed", "processing", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status." });
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json(order);
  } catch (e) { next(e); }
});

app.post("/api/payments/razorpay/order", auth, async (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ message: "Razorpay is not configured. Add test credentials to server/.env." });
    const order = await Order.findOne({ _id: req.body.orderId, user: req.user.id, paymentStatus: "pending" });
    if (!order) return res.status(404).json({ message: "Pending order not found." });
    const gateway = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const rzOrder = await gateway.orders.create({ amount: Math.round(order.total * 100), currency: "INR", receipt: String(order._id) });
    order.paymentProvider = "razorpay"; order.paymentReference = rzOrder.id; await order.save();
    res.json({ keyId: process.env.RAZORPAY_KEY_ID, razorpayOrder: rzOrder, amount: order.total });
  } catch (e) { next(e); }
});
app.post("/api/payments/razorpay/verify", auth, async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order || order.paymentReference !== razorpay_order_id) return res.status(400).json({ message: "Payment order does not match." });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const a = Buffer.from(expected); const b = Buffer.from(String(razorpay_signature || ""));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ message: "Payment signature verification failed." });
    order.paymentStatus = "paid"; order.status = "placed"; order.paymentReference = razorpay_payment_id; await order.save();
    res.json({ message: "Payment verified.", order });
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  console.error(err?.message || "Unhandled error");
  const status = err.status || (err.name === "ValidationError" ? 400 : err.code === 11000 ? 409 : 500);
  res.status(status).json({ message: status >= 500 ? "Something went wrong. Please try again." : err.message });
});

const port = Number(process.env.PORT || 5000);
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is required. Copy .env.example to .env and configure it.");
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pugazh_nila")
  .then(() => app.listen(port, () => console.log(`PUGAZH NILA API running at http://localhost:${port}`)))
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });

export { app, User, Product, Order, StitchingRequest };
