const calls: Record<string, number[]> = {};

const TTL = process.env.TTL ? parseInt(process.env.TTL, 10) : 1000 * 10;
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : 5;

export function isValidRequest(userIdentity: string, routerPath: string): boolean {
  const key = `${userIdentity}-${routerPath}`;

  const now = new Date().getTime();

  // clean expired calls
  calls[key] = (calls[key] || []).filter((timestamp) => timestamp > now - TTL);

  // add new call
  calls[key].push(now);

  // return call valid status
  return calls[key].length <= LIMIT;
}
