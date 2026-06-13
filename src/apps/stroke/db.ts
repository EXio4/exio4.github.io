import type { CharacterProgress, StrokeAttempt, StrokeSettings } from './types.ts'

export const STROKE_DB_NAME = 'stroke-v1'
export const STROKE_DB_VERSION = 1

const SETTINGS_KEY = 'settings'

type StoreName = 'progress' | 'attempts' | 'settings' | 'streaks'

interface SettingsRecord {
  key: string
  value: StrokeSettings
}

export const DEFAULT_SETTINGS: StrokeSettings = {
  dailyGoal: 10,
  leniency: 1,
  inputHintDismissed: false,
}

export function openStrokeDatabase(factory: IDBFactory = indexedDB): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(STROKE_DB_NAME, STROKE_DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'character' })
      }

      if (!db.objectStoreNames.contains('attempts')) {
        const attempts = db.createObjectStore('attempts', {
          keyPath: 'id',
          autoIncrement: true,
        })
        attempts.createIndex('character', 'character')
        attempts.createIndex('startedAt', 'startedAt')
        attempts.createIndex('deckId', 'deckId')
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }

      if (!db.objectStoreNames.contains('streaks')) {
        db.createObjectStore('streaks', { keyPath: 'key' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function deleteStrokeDatabase(factory: IDBFactory = indexedDB): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = factory.deleteDatabase(STROKE_DB_NAME)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('Stroke database deletion blocked'))
  })
}

export async function getSettings(db: IDBDatabase): Promise<StrokeSettings> {
  const record = await getRecord<SettingsRecord>(db, 'settings', SETTINGS_KEY)
  return record ? { ...DEFAULT_SETTINGS, ...record.value } : DEFAULT_SETTINGS
}

export async function saveSettings(
  db: IDBDatabase,
  patch: Partial<StrokeSettings>,
): Promise<StrokeSettings> {
  const next = { ...(await getSettings(db)), ...patch }
  await putRecord<SettingsRecord>(db, 'settings', { key: SETTINGS_KEY, value: next })
  return next
}

export function saveProgress(db: IDBDatabase, progress: CharacterProgress): Promise<void> {
  return putRecord(db, 'progress', progress)
}

export async function getAllProgress(db: IDBDatabase): Promise<CharacterProgress[]> {
  const records = await getAllRecords<CharacterProgress>(db, 'progress')
  return records.sort((a, b) => a.character.localeCompare(b.character))
}

export async function saveAttempt(db: IDBDatabase, attempt: StrokeAttempt): Promise<number> {
  const id = await addRecord(db, 'attempts', attempt)
  return Number(id)
}

export async function getAttemptsForCharacter(
  db: IDBDatabase,
  character: string,
): Promise<StrokeAttempt[]> {
  const attempts = await getAllRecords<StrokeAttempt>(db, 'attempts')
  return attempts
    .filter((attempt) => attempt.character === character)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

function getStore(
  db: IDBDatabase,
  storeName: StoreName,
  mode: IDBTransactionMode,
): IDBObjectStore {
  return db.transaction(storeName, mode).objectStore(storeName)
}

function getRecord<T>(db: IDBDatabase, storeName: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const request = getStore(db, storeName, 'readonly').get(key)
  return requestToPromise<T | undefined>(request)
}

function getAllRecords<T>(db: IDBDatabase, storeName: StoreName): Promise<T[]> {
  const request = getStore(db, storeName, 'readonly').getAll()
  return requestToPromise<T[]>(request)
}

function putRecord<T>(db: IDBDatabase, storeName: StoreName, value: T): Promise<void> {
  const transaction = db.transaction(storeName, 'readwrite')
  transaction.objectStore(storeName).put(value)
  return transactionToPromise(transaction)
}

function addRecord<T>(db: IDBDatabase, storeName: StoreName, value: T): Promise<IDBValidKey> {
  const transaction = db.transaction(storeName, 'readwrite')
  const request = transaction.objectStore(storeName).add(value)
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
