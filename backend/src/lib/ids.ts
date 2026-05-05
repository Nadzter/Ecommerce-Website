import { uuidv7 } from 'uuidv7';

/** Time-sortable UUIDv7 — preferred for primary keys to keep B-tree inserts hot. */
export function newId(): string {
  return uuidv7();
}
