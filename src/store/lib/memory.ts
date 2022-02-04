type StoreEntry = {
  timestamp: number,
  ttl: number | undefined,
  value: any,
}

const store: Record<string, StoreEntry> = {};

const DEFAULT_TTL = 1000 * 5; 

export async function get(key: string): Promise<undefined | any> {
  const entry: StoreEntry | undefined = store[key];

  if (!entry) {
    return;
  }

  const now = new Date().getTime();

  // without expiration
  if (!entry.ttl) {
    return entry.value;
  }

  if (entry.timestamp < now - entry.ttl) {
    return;
  }

  return entry.value;
}

export async function set(key: string, value: string | object, ttl: number = DEFAULT_TTL) {
  store[key] = {
    value,
    ttl,
    timestamp: new Date().getTime(),
  }
}