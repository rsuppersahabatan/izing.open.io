import * as crypto from "crypto";

import Redis from "ioredis";

const redis = new Redis({
  port: Number(process.env.IO_REDIS_PORT),
  host: process.env.IO_REDIS_SERVER,
  db: Number(process.env.IO_REDIS_DB_SESSION) || 9,
  password: process.env.IO_REDIS_PASSWORD || undefined
});

function encryptParams(params: any) {
  const str = JSON.stringify(params);
  return crypto.createHash("sha256").update(str).digest("base64");
}

export function setFromParams(
  key: string,
  params: any,
  value: string,
  option?: "EX" | "PX",
  optionValue?: number
) {
  const finalKey = `${key}:${encryptParams(params)}`;
  if (option !== undefined && optionValue !== undefined) {
    return set(finalKey, value, option, optionValue);
  }
  return set(finalKey, value);
}

export function getFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return get(finalKey);
}

export function delFromParams(key: string, params: any) {
  const finalKey = `${key}:${encryptParams(params)}`;
  return del(finalKey);
}

export function set(
  key: string,
  value: string,
  option?: "EX" | "PX",
  optionValue?: number
) {
  if (option !== undefined && optionValue !== undefined) {
    // Usando comando personalizado
    return redis.call("SET", key, value, option, optionValue.toString());
  }
  return redis.set(key, value);
}

export function get(key: string) {
  return redis.get(key);
}

export function getKeys(pattern: string) {
  return redis.keys(pattern);
}

export function del(key: string) {
  return redis.del(key);
}

export async function delFromPattern(pattern: string) {
  const all = await getKeys(pattern);
  for (const item of all!) {
    await del(item);
  }
}

export const cacheLayer = {
  set,
  setFromParams,
  get,
  getFromParams,
  getKeys,
  del,
  delFromParams,
  delFromPattern
};
