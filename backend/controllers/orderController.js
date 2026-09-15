import { pool } from "../config/db.js";
import { isValidId } from "../utils/helpers.js";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 10;
const FREE_DELIVERY_THRESHOLD = 5000;
const STANDARD_DELIVERY_FEE = 200;
const ORDER_NUMBER_PREFIX = "WS";

const parseAddress = (raw) => {
  if (!raw) return null;
  if (raw && typeof raw === "object") return raw;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
};

const buildCustomer = (order) => {
  const addr = parseAddress(order.shipping_address);
  const hasSnapshot = Boolean(addr && (addr.fullName || addr.email || addr.phone));
  const name = (hasSnapshot && addr.fullName) || order.customer_name || null;
  const email = (hasSnapshot && addr.email) || order.customer_email || null;
  const phone = (hasSnapshot && addr.phone) || order.customer_phone || null;
  if (!name && !email && !phone) return null;
  return { name, email, phone: phone || null };
};

const fetchOrderDetail = async (id) => {
  const [rows] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const order = rows[0];

  const [items] = await pool.query(
    `SELECT oi.id, oi.product_id, oi.product_name, oi.price, oi.quantity, oi.subtotal,
            (SELECT image FROM product_images pi WHERE pi.product_id = oi.product_id AND oi.product_id IS NOT NULL ORDER BY pi.id LIMIT 1) AS image
     FROM order_items oi
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [id]
  );

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    subtotal: Number(order.subtotal),
    shipping_fee: Number(order.shipping_fee),
    discount: Number(order.discount),
    total: Number(order.total),
    shipping_address: parseAddress(order.shipping_address) || null,
    created_at: order.created_at,
    updated_at: order.updated_at,
    customer: buildCustomer(order),
    items: items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      name: item.product_name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      subtotal: Number(item.subtotal),
      image: item.image || null,
    })),
  };
};

export const getOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit, 10) || DEFAULT_LIMIT;

    if (Number.isNaN(page) || page < 1) {
      return res.status(400).json({ success: false, message: "Page must be a positive integer" });
    }
    if (Number.isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Limit must be between 1 and ${MAX_LIMIT}`,
      });
    }

    const where = [];
    const params = [];

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const term = `%${search}%`;
      where.push("(o.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
      params.push(term, term, term);
    }

    if (req.query.status !== undefined && req.query.status !== "") {
      const status = String(req.query.status).toLowerCase();
      if (!ORDER_STATUSES.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid order status", errors: [`Status must be one of: ${ORDER_STATUSES.join(", ")}`] });
      }
      where.push("o.status = ?");
      params.push(status);
    }

    if (req.query.payment_status !== undefined && req.query.payment_status !== "") {
      const paymentStatus = String(req.query.payment_status).toLowerCase();
      if (!PAYMENT_STATUSES.includes(paymentStatus)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment status", errors: [`Payment status must be one of: ${PAYMENT_STATUSES.join(", ")}`] });
      }
      where.push("o.payment_status = ?");
      params.push(paymentStatus);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ${whereSql}`,
      params
    );
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const offset = (currentPage - 1) * limit;

    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method, o.total, o.created_at, o.shipping_address,
              u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ${whereSql}
       ORDER BY o.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: rows.map((row) => ({
        id: row.id,
        order_number: row.order_number,
        customer: buildCustomer(row),
        status: row.status,
        payment_status: row.payment_status,
        payment_method: row.payment_method,
        total: Number(row.total),
        item_count: Number(row.item_count || 0),
        created_at: row.created_at,
      })),
      pagination: { page: currentPage, limit, total, totalPages },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
};

export const getOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid order id is required" });
    }

    const order = await fetchOrderDetail(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve order" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid order id is required" });
    }

    const status = typeof req.body?.status === "string" ? req.body.status.trim().toLowerCase() : "";
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        errors: [`Status must be one of: ${ORDER_STATUSES.join(", ")}`],
      });
    }

    const [existing] = await pool.query("SELECT id, status FROM orders WHERE id = ?", [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await pool.execute("UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?", [status, id]);

    const order = await fetchOrderDetail(id);

    return res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid order id is required" });
    }

    const paymentStatus =
      typeof req.body?.payment_status === "string" ? req.body.payment_status.trim().toLowerCase() : "";
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
        errors: [`Payment status must be one of: ${PAYMENT_STATUSES.join(", ")}`],
      });
    }

    const [existing] = await pool.query("SELECT id, status, payment_status FROM orders WHERE id = ?", [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await pool.execute("UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?", [paymentStatus, id]);

    const order = await fetchOrderDetail(id);

    return res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update payment status" });
  }
};

const nextOrderNumber = async (connection) => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const [rows] = await connection.query(
      `SELECT IFNULL(MAX(CAST(SUBSTRING(order_number, ?) AS UNSIGNED)), 100000) AS current_max
       FROM orders
       WHERE order_number LIKE ?`,
      [`${ORDER_NUMBER_PREFIX}-`.length + 1, `${ORDER_NUMBER_PREFIX}-%`]
    );
    const next = Math.max(100001, Number(rows[0]?.current_max || 100000) + 1);
    const orderNumber = `${ORDER_NUMBER_PREFIX}-${String(next)}`;

    const [dups] = await connection.query("SELECT id FROM orders WHERE order_number = ?", [orderNumber]);
    if (!dups.length) return orderNumber;
  }
  throw new Error("Unable to allocate a unique order number");
};

export const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const shipping = req.body?.shipping && typeof req.body.shipping === "object" ? req.body.shipping : {};
    const paymentMethod =
      typeof req.body?.payment_method === "string" && req.body.payment_method.trim()
        ? req.body.payment_method.trim().toLowerCase()
        : "cod";

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "You must be logged in to place an order" });
    }
    if (!items.length) {
      return res.status(400).json({ success: false, message: "Your cart is empty", errors: ["At least one item is required"] });
    }
    if (!shipping.address || !shipping.city || !shipping.postalCode) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide the full shipping address", errors: ["Address, city and postal code are required"] });
    }

    const requested = [];
    for (const item of items) {
      const productId = Number(item?.product_id);
      const quantity = Number(item?.quantity);
      if (!isValidId(productId)) {
        return res.status(400).json({ success: false, message: "Invalid item in order", errors: [`Invalid product id: ${item?.product_id}`] });
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ success: false, message: "Invalid item quantity", errors: [`Quantity must be a positive integer for product ${productId}`] });
      }
      requested.push({ product_id: productId, quantity });
    }

    const ids = requested.map((r) => r.product_id);
    const [productRows] = await pool.query(
      "SELECT id, name, price, stock FROM products WHERE id IN (?)",
      [ids]
    );
    if (productRows.length !== new Set(ids).size) {
      return res.status(400).json({ success: false, message: "One or more products no longer exist" });
    }

    const productById = new Map(productRows.map((p) => [Number(p.id), p]));
    let subtotal = 0;
    const orderItems = [];
    for (const item of requested) {
      const product = productById.get(item.product_id);
      if (Number(product.stock) === 0) {
        return res.status(400).json({ success: false, message: `"${product.name}" is out of stock` });
      }
      if (item.quantity > Number(product.stock)) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} of "${product.name}" are available`,
        });
      }
      const lineTotal = Number(product.price) * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        product_id: Number(product.id),
        product_name: product.name,
        price: Number(product.price),
        quantity: item.quantity,
        subtotal: lineTotal,
      });
    }

    const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
    const discount = 0;
    const total = subtotal + shippingFee - discount;

    const addressPayload = {
      fullName: [shipping.first_name, shipping.last_name].filter(Boolean).join(" ") || `${req.user.name}`,
      email: shipping.email || req.user.email,
      phone: shipping.phone || req.user.phone || null,
      address: shipping.address,
      city: shipping.city,
      state: shipping.state || "",
      postalCode: shipping.postalCode,
      country: shipping.country || "Pakistan",
    };

    await connection.beginTransaction();

    const orderNumber = await nextOrderNumber(connection);

    const [orderResult] = await connection.execute(
      `INSERT INTO orders
        (user_id, order_number, status, subtotal, shipping_fee, discount, total, payment_method, payment_status, shipping_address, created_at, updated_at)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())`,
      [
        req.user.id,
        orderNumber,
        subtotal,
        shippingFee,
        discount,
        total,
        paymentMethod,
        JSON.stringify(addressPayload),
      ]
    );

    const orderId = Number(orderResult.insertId);

    await connection.query(
      `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
       VALUES ?`,
      [
        orderItems.map((item) => [
          orderId,
          item.product_id,
          item.product_name,
          item.price,
          item.quantity,
          item.subtotal,
        ]),
      ]
    );

    await connection.commit();

    const order = await fetchOrderDetail(orderId);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "A duplicate order was detected, please try again" });
    }
    if (err.message && err.message.includes("Unable to allocate")) {
      return res.status(409).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: "Failed to place order" });
  } finally {
    connection.release();
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method, o.subtotal,
              o.shipping_fee, o.discount, o.total, o.created_at
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.id DESC`,
      [req.user.id]
    );

    const [items] = await pool.query(
      `SELECT oi.order_id, oi.product_id, oi.product_name, oi.quantity, oi.price,
              pi.image
       FROM order_items oi
       LEFT JOIN product_images pi ON pi.product_id = oi.product_id
       WHERE oi.order_id IN (?)
       ORDER BY oi.order_id ASC, oi.id ASC`,
      [rows.length ? rows.map((r) => r.id) : [0]]
    );

    const itemsByOrder = new Map();
    for (const item of items) {
      const orderId = Number(item.order_id);
      if (!itemsByOrder.has(orderId)) itemsByOrder.set(orderId, []);
      itemsByOrder.get(orderId).push({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || null,
      });
    }

    return res.json({
      success: true,
      message: "Orders retrieved successfully",
      data: rows.map((row) => ({     id: row.id,
        order_number: row.order_number,
        status: row.status,
        payment_status: row.payment_status,
        payment_method: row.payment_method,
        subtotal: Number(row.subtotal),
        shipping_fee: Number(row.shipping_fee),
        discount: Number(row.discount),
        total: Number(row.total),
        item_count: Number(itemsByOrder.get(Number(row.id))?.length || 0),
        items: itemsByOrder.get(Number(row.id)) || [],
        created_at: row.created_at,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve orders" });
  }
};

export const getMyOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "A valid order id is required" });
    }

    const ownerId = await getOrderOwner(id);
    if (ownerId === null || String(ownerId) !== String(req.user.id)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = await fetchOrderDetail(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      message: "Order retrieved successfully",
      data: order,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve order" });
  }
};

const getOrderOwner = async (id) => {
  const [rows] = await pool.query("SELECT user_id FROM orders WHERE id = ?", [id]);
  return rows.length ? rows[0].user_id : null;
};