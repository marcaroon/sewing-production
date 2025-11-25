// lib/storage.ts

import {
  Order,
  Buyer,
  Style,
  TransferLog,
  ProcessHistoryLog,
  RejectLog,
  LeftoverMaterial,
  SewingLine,
  User,
  Bundle,
} from "./types";
import { STORAGE_KEYS } from "./constants";

// Generic Storage Functions
function getFromStorage<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from storage (${key}):`, error);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error);
  }
}

// Orders
export const orderStorage = {
  getAll: (): Order[] => getFromStorage<Order>(STORAGE_KEYS.ORDERS),

  getById: (id: string): Order | null => {
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    return orders.find((o) => o.id === id) || null;
  },

  getByOrderNumber: (orderNumber: string): Order | null => {
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    return orders.find((o) => o.orderNumber === orderNumber) || null;
  },

  save: (order: Order): void => {
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    const index = orders.findIndex((o) => o.id === order.id);

    if (index >= 0) {
      orders[index] = { ...order, updatedAt: new Date() };
    } else {
      orders.push(order);
    }

    saveToStorage(STORAGE_KEYS.ORDERS, orders);
  },

  delete: (id: string): void => {
    const orders = getFromStorage<Order>(STORAGE_KEYS.ORDERS);
    const filtered = orders.filter((o) => o.id !== id);
    saveToStorage(STORAGE_KEYS.ORDERS, filtered);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.ORDERS, []);
  },
};

// Buyers
export const buyerStorage = {
  getAll: (): Buyer[] => getFromStorage<Buyer>(STORAGE_KEYS.BUYERS),

  getById: (id: string): Buyer | null => {
    const buyers = getFromStorage<Buyer>(STORAGE_KEYS.BUYERS);
    return buyers.find((b) => b.id === id) || null;
  },

  save: (buyer: Buyer): void => {
    const buyers = getFromStorage<Buyer>(STORAGE_KEYS.BUYERS);
    const index = buyers.findIndex((b) => b.id === buyer.id);

    if (index >= 0) {
      buyers[index] = buyer;
    } else {
      buyers.push(buyer);
    }

    saveToStorage(STORAGE_KEYS.BUYERS, buyers);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.BUYERS, []);
  },
};

// Styles
export const styleStorage = {
  getAll: (): Style[] => getFromStorage<Style>(STORAGE_KEYS.STYLES),

  getById: (id: string): Style | null => {
    const styles = getFromStorage<Style>(STORAGE_KEYS.STYLES);
    return styles.find((s) => s.id === id) || null;
  },

  save: (style: Style): void => {
    const styles = getFromStorage<Style>(STORAGE_KEYS.STYLES);
    const index = styles.findIndex((s) => s.id === style.id);

    if (index >= 0) {
      styles[index] = style;
    } else {
      styles.push(style);
    }

    saveToStorage(STORAGE_KEYS.STYLES, styles);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.STYLES, []);
  },
};

// Transfer Logs
export const transferLogStorage = {
  getAll: (): TransferLog[] =>
    getFromStorage<TransferLog>(STORAGE_KEYS.TRANSFER_LOGS),

  getByOrderId: (orderId: string): TransferLog[] => {
    const logs = getFromStorage<TransferLog>(STORAGE_KEYS.TRANSFER_LOGS);
    return logs.filter((l) => l.orderId === orderId);
  },

  getById: (id: string): TransferLog | null => {
    const logs = getFromStorage<TransferLog>(STORAGE_KEYS.TRANSFER_LOGS);
    return logs.find((l) => l.id === id) || null;
  },

  save: (log: TransferLog): void => {
    const logs = getFromStorage<TransferLog>(STORAGE_KEYS.TRANSFER_LOGS);
    const index = logs.findIndex((l) => l.id === log.id);

    if (index >= 0) {
      logs[index] = log;
    } else {
      logs.push(log);
    }

    saveToStorage(STORAGE_KEYS.TRANSFER_LOGS, logs);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.TRANSFER_LOGS, []);
  },
};

// Process History
export const processHistoryStorage = {
  getAll: (): ProcessHistoryLog[] =>
    getFromStorage<ProcessHistoryLog>(STORAGE_KEYS.PROCESS_HISTORY),

  getByOrderId: (orderId: string): ProcessHistoryLog[] => {
    const history = getFromStorage<ProcessHistoryLog>(
      STORAGE_KEYS.PROCESS_HISTORY
    );
    return history
      .filter((h) => h.orderId === orderId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  },

  save: (log: ProcessHistoryLog): void => {
    const history = getFromStorage<ProcessHistoryLog>(
      STORAGE_KEYS.PROCESS_HISTORY
    );
    history.push(log);
    saveToStorage(STORAGE_KEYS.PROCESS_HISTORY, history);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.PROCESS_HISTORY, []);
  },
};

// Reject Logs
export const rejectLogStorage = {
  getAll: (): RejectLog[] =>
    getFromStorage<RejectLog>(STORAGE_KEYS.REJECT_LOGS),

  getByOrderId: (orderId: string): RejectLog[] => {
    const logs = getFromStorage<RejectLog>(STORAGE_KEYS.REJECT_LOGS);
    return logs.filter((l) => l.orderId === orderId);
  },

  save: (log: RejectLog): void => {
    const logs = getFromStorage<RejectLog>(STORAGE_KEYS.REJECT_LOGS);
    logs.push(log);
    saveToStorage(STORAGE_KEYS.REJECT_LOGS, logs);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.REJECT_LOGS, []);
  },
};

// Leftover Materials
export const leftoverStorage = {
  getAll: (): LeftoverMaterial[] =>
    getFromStorage<LeftoverMaterial>(STORAGE_KEYS.LEFTOVER_MATERIALS),

  getByOrderId: (orderId: string): LeftoverMaterial | null => {
    const leftovers = getFromStorage<LeftoverMaterial>(
      STORAGE_KEYS.LEFTOVER_MATERIALS
    );
    return leftovers.find((l) => l.orderId === orderId) || null;
  },

  save: (leftover: LeftoverMaterial): void => {
    const leftovers = getFromStorage<LeftoverMaterial>(
      STORAGE_KEYS.LEFTOVER_MATERIALS
    );
    const index = leftovers.findIndex((l) => l.id === leftover.id);

    if (index >= 0) {
      leftovers[index] = leftover;
    } else {
      leftovers.push(leftover);
    }

    saveToStorage(STORAGE_KEYS.LEFTOVER_MATERIALS, leftovers);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.LEFTOVER_MATERIALS, []);
  },
};

// Sewing Lines
export const sewingLineStorage = {
  getAll: (): SewingLine[] =>
    getFromStorage<SewingLine>(STORAGE_KEYS.SEWING_LINES),

  getById: (id: string): SewingLine | null => {
    const lines = getFromStorage<SewingLine>(STORAGE_KEYS.SEWING_LINES);
    return lines.find((l) => l.id === id) || null;
  },

  save: (line: SewingLine): void => {
    const lines = getFromStorage<SewingLine>(STORAGE_KEYS.SEWING_LINES);
    const index = lines.findIndex((l) => l.id === line.id);

    if (index >= 0) {
      lines[index] = line;
    } else {
      lines.push(line);
    }

    saveToStorage(STORAGE_KEYS.SEWING_LINES, lines);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.SEWING_LINES, []);
  },
};

// Bundles
export const bundleStorage = {
  getAll: (): Bundle[] => getFromStorage<Bundle>(STORAGE_KEYS.BUNDLES),

  getByOrderId: (orderId: string): Bundle[] => {
    const bundles = getFromStorage<Bundle>(STORAGE_KEYS.BUNDLES);
    return bundles.filter((b) => b.orderId === orderId);
  },

  save: (bundle: Bundle): void => {
    const bundles = getFromStorage<Bundle>(STORAGE_KEYS.BUNDLES);
    const index = bundles.findIndex(
      (b) => b.bundleNumber === bundle.bundleNumber
    );

    if (index >= 0) {
      bundles[index] = { ...bundle, lastUpdated: new Date() };
    } else {
      bundles.push(bundle);
    }

    saveToStorage(STORAGE_KEYS.BUNDLES, bundles);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.BUNDLES, []);
  },
};

// Users
export const userStorage = {
  getAll: (): User[] => getFromStorage<User>(STORAGE_KEYS.USERS),

  getById: (id: string): User | null => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    return users.find((u) => u.id === id) || null;
  },

  save: (user: User): void => {
    const users = getFromStorage<User>(STORAGE_KEYS.USERS);
    const index = users.findIndex((u) => u.id === user.id);

    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }

    saveToStorage(STORAGE_KEYS.USERS, users);
  },

  clear: (): void => {
    saveToStorage(STORAGE_KEYS.USERS, []);
  },
};

// Clear All Data
export const clearAllStorage = (): void => {
  if (typeof window === "undefined") return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};
