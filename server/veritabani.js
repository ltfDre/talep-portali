import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { tohumla } from './tohum.js'

const SUNUCU_KLASORU = path.dirname(fileURLToPath(import.meta.url))
const PROJE_KOKU = path.dirname(SUNUCU_KLASORU)

function veritabaniAc(yol) {
  if (yol === ':memory:') return new Database(yol)

  const tamYol = path.resolve(PROJE_KOKU, yol)
  mkdirSync(path.dirname(tamYol), { recursive: true })
  return new Database(tamYol)
}

export const db = veritabaniAc(process.env.VERITABANI_YOLU ?? 'veri/talep.db')

// SPEC Bölüm 3.
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

db.exec(readFileSync(path.join(SUNUCU_KLASORU, 'sema.sql'), 'utf8'))
tohumla(db)
