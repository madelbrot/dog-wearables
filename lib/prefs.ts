import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_DOG_ID = 'dog_id';
const KEY_LAST_BG = 'last_bg_run_ts';

export async function setDogId(id: string) {
  await AsyncStorage.setItem(KEY_DOG_ID, id);
}
export async function getDogId() {
  return AsyncStorage.getItem(KEY_DOG_ID);
}

export async function setLastBgRun(ts: number) {
  await AsyncStorage.setItem(KEY_LAST_BG, String(ts));
}
export async function getLastBgRun() {
  const v = await AsyncStorage.getItem(KEY_LAST_BG);
  return v ? parseInt(v, 10) : 0;
}
