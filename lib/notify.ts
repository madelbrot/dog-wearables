import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_INSIGHT_PUSH = 'last_insight_push_ts';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotifyPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  }
  return true;
}

export async function sendInsightNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null
  });
}

export async function getLastInsightPushTs() {
  const v = await AsyncStorage.getItem(KEY_LAST_INSIGHT_PUSH);
  return v ? parseInt(v, 10) : 0;
}

export async function setLastInsightPushTs(ts: number) {
  await AsyncStorage.setItem(KEY_LAST_INSIGHT_PUSH, String(ts));
}
