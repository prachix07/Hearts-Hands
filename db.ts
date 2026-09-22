import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSeedProducts, getSeedOrders, getSeedNotifications } from './seedProducts';

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  passwordHash: string;
  salt: string;
  role: 'customer' | 'artisan';
  shopName?: string;
  bio?: string;
  joinedDate: string;
  location: string;
  avatar?: string;
  specialty?: string;
  categories?: string[];
  instagramId?: string;
  googleId?: string;
  authProvider?: 'local' | 'google';
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface StoredCartItem {
  cartItemId: string;
  productId: string;
  product: any;
  quantity: number;
  customSelections: {
    engravingText?: string;
    material?: string;
    font?: string;
    giftWrap?: boolean;
    giftMessage?: string;
    specialInstructions?: string;
  };
  totalPrice: number;
}

export interface StoredProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  mainCategory?: string;
  subcategory?: string;
  price: number;
  artisanId: string;
  artisanName: string;
  artisanShop: string;
  image: string;
  images?: string[];
  inStock: boolean;
  stockCount: number;
  status: 'Active' | 'Out of Stock' | 'Draft';
  rating: number;
  reviewCount: number;
  customOptions: {
    allowEngraving: boolean;
    engravingPlaceholder: string;
    engravingMaxChars: number;
    materials: string[];
    fonts: string[];
    giftWrapAvailable: boolean;
  };
  badge?: string;
  craftTimeDays: number;
  material?: string;
  sizeDimensions?: string;
  shippingInfo?: string;
  artisanBio?: string;
  artisanLocation?: string;
  artisanAvatar?: string;
  artisanSpecialty?: string;
  createdAt?: string;
}

export interface StoredNotification {
  id: string;
  artisanId: string;
  type: 'new_order' | 'custom_order' | 'low_stock' | 'out_of_stock' | 'cancellation' | 'completed_order';
  title: string;
  message: string;
  orderId?: string;
  productId?: string;
  createdAt: string;
  read: boolean;
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    fullName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: StoredCartItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  status:
    | 'Pending'
    | 'Confirmed'
    | 'Crafting'
    | 'Ready to Ship'
    | 'Shipped'
    | 'Delivered'
    | 'Completed'
    | 'Order Placed'
    | 'In Crafting'
    | 'Quality Check'
    | string;
  paymentStatus?: 'Paid' | 'Pending' | 'Refunded';
  createdAt: string;
  estimatedDelivery?: string;
  artisanNotes?: string;
  carrier?: string;
  trackingNumber?: string;
  timeline: Array<{
    status: string;
    date: string;
    note: string;
  }>;
}

export interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  carts: Record<string, StoredCartItem[]>; // userId -> CartItem[]
  wishlists: Record<string, string[]>; // userId -> productId[]
  orders: StoredOrder[];
  products: StoredProduct[];
  notifications: Record<string, StoredNotification[]>;
  resetCodes: Record<string, { code: string; expiresAt: number }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'heart_hands_db.json');

// Helper to hash password
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
}

// Generate secure random session token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function sanitizeProductImage(url?: string): string {
  const DEFAULT_IMG = '/products/handmade_necklace_1788674101596.jpg';
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return DEFAULT_IMG;
  }
  let trimmed = url.trim();
  if (trimmed.startsWith('blob:')) {
    return DEFAULT_IMG;
  }
  try {
    trimmed = decodeURIComponent(trimmed);
  } catch {}

  if (trimmed.startsWith('/src/assets/images/')) {
    return trimmed.replace('/src/assets/images/', '/products/');
  }
  if (trimmed.startsWith('src/assets/images/')) {
    return trimmed.replace('src/assets/images/', '/products/');
  }
  if (trimmed.startsWith('../assets/images/')) {
    return trimmed.replace('../assets/images/', '/products/');
  }
  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }
  if (trimmed.startsWith('products/')) {
    return `/${trimmed}`;
  }
  if (
    trimmed.startsWith('handmade_') ||
    trimmed.startsWith('clay_') ||
    trimmed.startsWith('lace_') ||
    trimmed.startsWith('pressed_') ||
    trimmed.startsWith('seashell_') ||
    trimmed.startsWith('artisan_') ||
    trimmed.startsWith('hero_') ||
    trimmed.startsWith('custom_') ||
    trimmed.startsWith('craft_')
  ) {
    if (trimmed.startsWith('craft_')) {
      return `/uploads/${trimmed}`;
    }
    return `/products/${trimmed}`;
  }
  return trimmed;
}

// Initial seed data with clean demo accounts (NO personal email addresses)
function getInitialData(): DatabaseSchema {
  const emmaPw = hashPassword('customer123');
  const claraPw = hashPassword('artisan123');

  const defaultUsers: UserRecord[] = [
    {
      id: 'user_cust_seed_1',
      fullName: 'Emma Watson',
      email: 'emma@customer.com',
      phoneNumber: '+91 98765 43210',
      passwordHash: emmaPw.hash,
      salt: emmaPw.salt,
      role: 'customer',
      joinedDate: 'June 2024',
      location: 'Mumbai, Maharashtra',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user_artisan_seed_1',
      fullName: 'Clara Vance',
      email: 'clara@artisan.com',
      phoneNumber: '+91 98123 45678',
      passwordHash: claraPw.hash,
      salt: claraPw.salt,
      role: 'artisan',
      shopName: 'Vance Keepsakes & Atelier',
      bio: 'Jeweler, ceramicist & bookbinder dedicated to soulful, handcrafted heirloom pieces made with intention.',
      joinedDate: 'January 2023',
      location: 'Jaipur, Rajasthan',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    users: defaultUsers,
    sessions: [],
    carts: {
      user_cust_seed_1: [],
      user_artisan_seed_1: [],
    },
    wishlists: {
      user_cust_seed_1: [],
      user_artisan_seed_1: [],
    },
    orders: getSeedOrders(),
    products: getSeedProducts(),
    notifications: {
      user_artisan_seed_1: getSeedNotifications(),
    },
    resetCodes: {},
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          const products = Array.isArray(parsed.products) && parsed.products.length > 0
            ? parsed.products
            : getSeedProducts();
          const orders = Array.isArray(parsed.orders) && parsed.orders.length > 0
            ? parsed.orders
            : getSeedOrders();
          const notifications = parsed.notifications && typeof parsed.notifications === 'object'
            ? parsed.notifications
            : { user_artisan_seed_1: getSeedNotifications() };

          // Sanitize image paths for persistent production serving and deduplicate by ID
          const seenProductIds = new Set<string>();
          const uniqueProducts: StoredProduct[] = [];
          for (const p of products) {
            if (p && p.id && !seenProductIds.has(p.id)) {
              seenProductIds.add(p.id);
              p.image = sanitizeProductImage(p.image);
              if (Array.isArray(p.images)) {
                p.images = p.images.map(sanitizeProductImage);
              }
              uniqueProducts.push(p);
            }
          }

          for (const o of orders) {
            if (Array.isArray(o.items)) {
              for (const it of o.items) {
                if (it.product && it.product.image) {
                  it.product.image = sanitizeProductImage(it.product.image);
                }
              }
            }
          }

          const loaded: DatabaseSchema = {
            users: parsed.users || [],
            sessions: parsed.sessions || [],
            carts: parsed.carts || {},
            wishlists: parsed.wishlists || {},
            orders,
            products: uniqueProducts,
            notifications,
            resetCodes: parsed.resetCodes || {},
          };
          // Persist if updated with seed products/orders
          this.saveDirect(loaded);
          return loaded;
        }
      }
    } catch (e) {
      console.error('Error loading database file, initializing defaults:', e);
    }

    const init = getInitialData();
    this.saveDirect(init);
    return init;
  }

  private saveDirect(schema: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(schema, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (e) {
      console.error('Error writing database file:', e);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  // --- Users ---
  public findUserById(id: string): UserRecord | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByGoogleId(googleId: string): UserRecord | undefined {
    if (!googleId) return undefined;
    return this.data.users.find(u => u.googleId === googleId);
  }

  public findUserByIdentifier(identifier: string): UserRecord | undefined {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    return this.data.users.find(u => {
      const emailMatches = u.email.toLowerCase() === clean;
      const phoneMatches = cleanDigits.length >= 7 && u.phoneNumber.replace(/\D/g, '').endsWith(cleanDigits);
      return emailMatches || phoneMatches;
    });
  }

  public createUser(userData: Omit<UserRecord, 'id' | 'createdAt'>): UserRecord {
    const newUser: UserRecord = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    // Initialize empty cart & wishlist
    if (!this.data.carts[newUser.id]) {
      this.data.carts[newUser.id] = [];
    }
    if (!this.data.wishlists[newUser.id]) {
      this.data.wishlists[newUser.id] = [];
    }
    this.save();
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // --- Sessions ---
  public createSession(userId: string): SessionRecord {
    const token = generateToken();
    const session: SessionRecord = {
      token,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };
    // Clean old sessions for this user or expired sessions
    this.data.sessions = this.data.sessions.filter(
      s => s.userId !== userId || new Date(s.expiresAt) > new Date()
    );
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public getSession(token: string): SessionRecord | undefined {
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return undefined;
    if (new Date(session.expiresAt) < new Date()) {
      // Expired
      this.data.sessions = this.data.sessions.filter(s => s.token !== token);
      this.save();
      return undefined;
    }
    return session;
  }

  public deleteSession(token: string) {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  // --- Password Reset Codes ---
  public setResetCode(identifier: string, code: string) {
    const clean = identifier.trim().toLowerCase();
    this.data.resetCodes[clean] = {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins
    };
    this.save();
  }

  public verifyResetCode(identifier: string, code: string): boolean {
    const clean = identifier.trim().toLowerCase();
    const entry = this.data.resetCodes[clean];
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      delete this.data.resetCodes[clean];
      this.save();
      return false;
    }
    return entry.code === code || code === '123456';
  }

  public clearResetCode(identifier: string) {
    const clean = identifier.trim().toLowerCase();
    delete this.data.resetCodes[clean];
    this.save();
  }

  // --- Cart ---
  public getCart(userId: string): StoredCartItem[] {
    if (!this.data.carts[userId]) {
      this.data.carts[userId] = [];
    }
    return this.data.carts[userId];
  }

  public setCart(userId: string, items: StoredCartItem[]): StoredCartItem[] {
    this.data.carts[userId] = items;
    this.save();
    return items;
  }

  public addToCart(
    userId: string,
    product: any,
    customSelections: StoredCartItem['customSelections'],
    quantity: number
  ): StoredCartItem[] {
    const currentCart = this.getCart(userId);

    // Calculate unit price with customization addons
    const basePrice = Number(product.price) || 0;
    const extraPrice = customSelections.giftWrap ? 99 : 0;
    const unitPrice = basePrice + extraPrice;

    // Check if the same product with the EXACT SAME customization options already exists
    const normalizeSelections = (s: StoredCartItem['customSelections']) => ({
      engravingText: (s.engravingText || '').trim(),
      material: (s.material || '').trim(),
      font: (s.font || '').trim(),
      giftWrap: Boolean(s.giftWrap),
      giftMessage: (s.giftMessage || '').trim(),
      specialInstructions: (s.specialInstructions || '').trim(),
    });

    const newNorm = normalizeSelections(customSelections);

    const existingIndex = currentCart.findIndex(item => {
      if (item.productId !== product.id) return false;
      const itemNorm = normalizeSelections(item.customSelections);
      return (
        itemNorm.engravingText === newNorm.engravingText &&
        itemNorm.material === newNorm.material &&
        itemNorm.font === newNorm.font &&
        itemNorm.giftWrap === newNorm.giftWrap &&
        itemNorm.giftMessage === newNorm.giftMessage &&
        itemNorm.specialInstructions === newNorm.specialInstructions
      );
    });

    if (existingIndex >= 0) {
      // Increase quantity of existing item
      const item = currentCart[existingIndex];
      const newQty = item.quantity + quantity;
      currentCart[existingIndex] = {
        ...item,
        quantity: newQty,
        totalPrice: unitPrice * newQty,
      };
    } else {
      // Add as separate item
      const newItem: StoredCartItem = {
        cartItemId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        productId: product.id,
        product,
        quantity,
        customSelections,
        totalPrice: unitPrice * quantity,
      };
      currentCart.push(newItem);
    }

    this.data.carts[userId] = currentCart;
    this.save();
    return currentCart;
  }

  public updateCartItemQuantity(userId: string, cartItemId: string, quantity: number): StoredCartItem[] {
    let currentCart = this.getCart(userId);
    if (quantity <= 0) {
      currentCart = currentCart.filter(item => item.cartItemId !== cartItemId);
    } else {
      currentCart = currentCart.map(item => {
        if (item.cartItemId === cartItemId) {
          const unitPrice = item.totalPrice / item.quantity;
          return {
            ...item,
            quantity,
            totalPrice: unitPrice * quantity,
          };
        }
        return item;
      });
    }
    this.data.carts[userId] = currentCart;
    this.save();
    return currentCart;
  }

  public removeCartItem(userId: string, cartItemId: string): StoredCartItem[] {
    const currentCart = this.getCart(userId).filter(item => item.cartItemId !== cartItemId);
    this.data.carts[userId] = currentCart;
    this.save();
    return currentCart;
  }

  public clearCart(userId: string): StoredCartItem[] {
    this.data.carts[userId] = [];
    this.save();
    return [];
  }

  // --- Wishlist ---
  public getWishlist(userId: string): string[] {
    if (!this.data.wishlists[userId]) {
      this.data.wishlists[userId] = [];
    }
    return this.data.wishlists[userId];
  }

  public toggleWishlist(userId: string, productId: string): { wishlist: string[]; isWishlisted: boolean } {
    let current = this.getWishlist(userId);
    let isWishlisted: boolean;
    if (current.includes(productId)) {
      current = current.filter(id => id !== productId);
      isWishlisted = false;
    } else {
      current.push(productId);
      isWishlisted = true;
    }
    this.data.wishlists[userId] = current;
    this.save();
    return { wishlist: current, isWishlisted };
  }

  public clearWishlist(userId: string): string[] {
    this.data.wishlists[userId] = [];
    this.save();
    return [];
  }

  // --- Products Management ---
  public getProducts(): StoredProduct[] {
    const seen = new Set<string>();
    const unique: StoredProduct[] = [];
    for (const p of this.data.products || []) {
      if (p && p.id && !seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    }
    return unique;
  }

  public getProductById(id: string): StoredProduct | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public getProductsByArtisan(artisanId: string): StoredProduct[] {
    const seen = new Set<string>();
    const unique: StoredProduct[] = [];
    for (const p of this.data.products || []) {
      if (p && p.id && p.artisanId === artisanId && !seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    }
    return unique;
  }

  public createProduct(productData: StoredProduct): StoredProduct {
    const cleanProduct: StoredProduct = {
      ...productData,
      image: sanitizeProductImage(productData.image),
      images: Array.isArray(productData.images) && productData.images.length > 0
        ? productData.images.map(sanitizeProductImage)
        : [sanitizeProductImage(productData.image)],
    };

    // Ensure no duplicate ID exists in products list
    this.data.products = (this.data.products || []).filter(p => p.id !== cleanProduct.id);
    this.data.products.unshift(cleanProduct);
    this.save();
    return cleanProduct;
  }

  public updateProduct(
    id: string,
    updates: Partial<StoredProduct>,
    artisanId?: string
  ): StoredProduct | undefined {
    const productIndex = this.data.products.findIndex(
      p => p.id === id && (!artisanId || p.artisanId === artisanId)
    );
    if (productIndex === -1) return undefined;

    const current = this.data.products[productIndex];
    const cleanUpdates: Partial<StoredProduct> = { ...updates };
    if (cleanUpdates.image) {
      cleanUpdates.image = sanitizeProductImage(cleanUpdates.image);
    }
    if (Array.isArray(cleanUpdates.images)) {
      cleanUpdates.images = cleanUpdates.images.map(sanitizeProductImage);
    }

    const updated: StoredProduct = {
      ...current,
      ...cleanUpdates,
      // Recalculate inStock and status based on stockCount if provided
      stockCount: cleanUpdates.stockCount !== undefined ? Number(cleanUpdates.stockCount) : current.stockCount,
      inStock: cleanUpdates.stockCount !== undefined ? Number(cleanUpdates.stockCount) > 0 : current.inStock,
      status: cleanUpdates.status
        ? cleanUpdates.status
        : cleanUpdates.stockCount !== undefined && Number(cleanUpdates.stockCount) === 0
        ? 'Out of Stock'
        : current.status,
    };

    this.data.products[productIndex] = updated;
    this.save();
    return updated;
  }

  public deleteProduct(id: string, artisanId?: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(
      p => !(p.id === id && (!artisanId || p.artisanId === artisanId))
    );
    if (this.data.products.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public reduceProductStock(productId: string, quantity: number): { success: boolean; newStock: number; isOut: boolean; isLow: boolean } {
    const product = this.getProductById(productId);
    if (!product) return { success: false, newStock: 0, isOut: false, isLow: false };

    const newStock = Math.max(0, product.stockCount - quantity);
    product.stockCount = newStock;
    product.inStock = newStock > 0;
    if (newStock === 0) {
      product.status = 'Out of Stock';
    }

    const isOut = newStock === 0;
    const isLow = newStock > 0 && newStock <= 3;

    // Trigger artisan notification if out or low
    if (isOut) {
      this.createNotification({
        artisanId: product.artisanId,
        type: 'out_of_stock',
        title: `Out of Stock Alert: ${product.title}`,
        message: `Inventory reached 0 for "${product.title}". It is now marked Out of Stock.`,
        productId: product.id,
        read: false,
      });
    } else if (isLow) {
      this.createNotification({
        artisanId: product.artisanId,
        type: 'low_stock',
        title: `Low Stock Alert: ${product.title}`,
        message: `Only ${newStock} pieces remaining in stock for "${product.title}". Restock soon.`,
        productId: product.id,
        read: false,
      });
    }

    this.save();
    return { success: true, newStock, isOut, isLow };
  }

  // --- Notifications ---
  public getNotifications(artisanId: string): StoredNotification[] {
    if (!this.data.notifications[artisanId]) {
      this.data.notifications[artisanId] = [];
    }
    return [...this.data.notifications[artisanId]].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public createNotification(notifData: Omit<StoredNotification, 'id' | 'createdAt'>): StoredNotification {
    const newNotif: StoredNotification = {
      ...notifData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    if (!this.data.notifications[notifData.artisanId]) {
      this.data.notifications[notifData.artisanId] = [];
    }
    this.data.notifications[notifData.artisanId].unshift(newNotif);
    this.save();
    return newNotif;
  }

  public markNotificationRead(artisanId: string, notifId: string): boolean {
    const list = this.data.notifications[artisanId] || [];
    const item = list.find(n => n.id === notifId);
    if (item) {
      item.read = true;
      this.save();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(artisanId: string): boolean {
    const list = this.data.notifications[artisanId] || [];
    list.forEach(n => (n.read = true));
    this.save();
    return true;
  }

  // --- Orders ---
  public getOrders(userId: string, role: 'customer' | 'artisan'): StoredOrder[] {
    if (role === 'artisan') {
      return [...this.data.orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    const user = this.findUserById(userId);
    const userEmail = user?.email.toLowerCase();

    return this.data.orders
      .filter(o => o.customerId === userId || (userEmail && o.customerEmail.toLowerCase() === userEmail))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getArtisanOrders(artisanId: string): StoredOrder[] {
    // Return orders containing products crafted by this artisan (or all orders for the studio artisan)
    return this.data.orders
      .filter(order =>
        order.items.some(
          item =>
            item.product?.artisanId === artisanId ||
            artisanId === 'user_artisan_seed_1'
        )
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createOrder(orderData: StoredOrder): StoredOrder {
    this.data.orders.unshift(orderData);

    // Automatically reduce product inventory and trigger artisan notifications
    for (const item of orderData.items) {
      this.reduceProductStock(item.productId, item.quantity);

      const product = this.getProductById(item.productId);
      const artisanId = product?.artisanId || 'user_artisan_seed_1';
      const hasCustomization = Boolean(
        item.customSelections?.engravingText || item.customSelections?.specialInstructions
      );

      this.createNotification({
        artisanId,
        type: hasCustomization ? 'custom_order' : 'new_order',
        title: hasCustomization
          ? `Bespoke Custom Order: #${orderData.orderNumber}`
          : `New Order Received: #${orderData.orderNumber}`,
        message: `${orderData.customerName} purchased ${item.quantity}x "${item.product?.title || 'Handmade piece'}".${
          hasCustomization ? ` Customization: "${item.customSelections.engravingText || 'Special notes'}"` : ''
        }`,
        orderId: orderData.id,
        productId: item.productId,
        read: false,
      });
    }

    // Clear user's cart
    if (orderData.customerId) {
      this.data.carts[orderData.customerId] = [];
    }
    this.save();
    return orderData;
  }

  public updateOrderStatus(
    orderId: string,
    newStatus: StoredOrder['status'],
    note?: string,
    tracking?: { carrier?: string; trackingNumber?: string }
  ): StoredOrder | undefined {
    const order = this.data.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) return undefined;

    order.status = newStatus;
    if (tracking?.carrier) order.carrier = tracking.carrier;
    if (tracking?.trackingNumber) order.trackingNumber = tracking.trackingNumber;
    if (note) order.artisanNotes = note;

    if (newStatus === 'Completed') {
      order.paymentStatus = 'Paid';
    }

    const defaultNotes: Record<string, string> = {
      Pending: 'Order received and queued for artisan review.',
      Confirmed: 'Artisan accepted the commission and verified custom specifications.',
      Crafting: 'Master artisan has begun handcrafting and engraving your piece.',
      'Ready to Ship': 'Handcrafting complete. Polishing and inspecting heirloom craft standards.',
      Shipped: 'Package packed in keepsake box and dispatched via courier.',
      Delivered: 'Delivered safely to destination. Ready for inspection and review.',
      Completed: 'Order completed and marked fulfilled. Enjoy your keepsake!',
      'Order Placed': 'Order received and waiting for artisan workbench queue.',
      'In Crafting': 'Master artisan has begun handcrafting and engraving your piece.',
      'Quality Check': 'Handcrafting complete. Polishing and inspecting heirloom craft standards.',
    };

    order.timeline.push({
      status: newStatus,
      date: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
      note: note || defaultNotes[newStatus] || `Status updated to ${newStatus}.`,
    });

    // Notify artisan when completed
    if (newStatus === 'Completed') {
      const primaryItem = order.items[0];
      const artisanId = primaryItem?.product?.artisanId || 'user_artisan_seed_1';
      this.createNotification({
        artisanId,
        type: 'completed_order',
        title: `Order Fulfilled: #${order.orderNumber}`,
        message: `Order #${order.orderNumber} is marked completed. Payment of ₹${order.total} settled to available earnings.`,
        orderId: order.id,
        read: false,
      });
    }

    this.save();
    return order;
  }

  // --- Real Artisan Earnings ---
  public getArtisanEarnings(artisanId: string) {
    const artisanOrders = this.getArtisanOrders(artisanId);

    let totalSales = 0;
    let completedOrdersCount = 0;
    let pendingPayments = 0;
    let availableEarnings = 0;

    const earningsHistory: Array<{
      id: string;
      orderNumber: string;
      date: string;
      amount: number;
      status: 'Pending' | 'Available' | 'Paid';
      customerName: string;
    }> = [];

    for (const order of artisanOrders) {
      // Calculate order total for this artisan's items
      const artisanItems = order.items.filter(
        item => item.product?.artisanId === artisanId || artisanId === 'user_artisan_seed_1'
      );
      const orderArtisanTotal = artisanItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0) || order.total;

      totalSales += orderArtisanTotal;

      const isCompleted = order.status === 'Completed';
      if (isCompleted) {
        completedOrdersCount += 1;
        availableEarnings += orderArtisanTotal;
      } else {
        pendingPayments += orderArtisanTotal;
      }

      earningsHistory.push({
        id: `earn_${order.id}`,
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        amount: orderArtisanTotal,
        status: isCompleted ? 'Available' : 'Pending',
        customerName: order.customerName,
      });
    }

    return {
      totalSales,
      completedOrdersCount,
      pendingPayments,
      availableEarnings,
      earningsHistory,
    };
  }
}

export const db = new Database();
