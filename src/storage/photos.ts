import { clear, createStore, del, get, set } from 'idb-keyval';

const photoStore = createStore('mission-photos', 'photos');

export async function savePhoto(key: string, blob: Blob): Promise<void> {
  await set(key, blob, photoStore);
}

export async function getPhoto(key: string): Promise<Blob | undefined> {
  return get<Blob>(key, photoStore);
}

export async function deletePhoto(key: string): Promise<void> {
  await del(key, photoStore);
}

export async function clearAllPhotos(): Promise<void> {
  await clear(photoStore);
}
