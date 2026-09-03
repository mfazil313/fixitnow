/**
 * localJobsStore.ts
 * Persists local (non-Supabase) jobs to disk at .local-jobs.json
 * so they survive Next.js server restarts.
 */

import fs from 'fs';
import path from 'path';
import { Job } from '@/lib/types';

const STORE_PATH = path.join(process.cwd(), '.local-jobs.json');

function readFromDisk(): Map<string, Job> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const arr: Job[] = JSON.parse(raw);
      return new Map(arr.map((j) => [j.id, j]));
    }
  } catch {
    // corrupted file — start fresh
  }
  return new Map();
}

function writeToDisk(jobs: Map<string, Job>): void {
  try {
    const arr = Array.from(jobs.values());
    fs.writeFileSync(STORE_PATH, JSON.stringify(arr, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[localJobsStore] Failed to persist jobs to disk:', err);
  }
}

// Singleton in-memory cache backed by disk
let _cache: Map<string, Job> | null = null;

function getCache(): Map<string, Job> {
  if (!_cache) {
    _cache = readFromDisk();
  }
  return _cache;
}

export function saveLocalJob(job: Job): void {
  const cache = getCache();
  cache.set(job.id, job);
  writeToDisk(cache);
}

export function getLocalJob(jobId: string): Job | null {
  return getCache().get(jobId) ?? null;
}

export function getAllLocalJobs(): Job[] {
  return Array.from(getCache().values());
}
