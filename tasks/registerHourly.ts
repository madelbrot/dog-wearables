import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { TASK_HOURLY } from '../lib/tasks';
import { flushHR, flushAudioEvents } from '../lib/upload';
import { getDogId } from '../lib/prefs';
import { computeCarBarkInsight, computeDogSeenHRInsight, computeNightWhineInsight, computeCarHRElevation, computePlayCalmInsight, computeStrangerStressInsight, computeRelaxInsight } from '../lib/insights';
import { supabase, hasSupabase } from '../lib/supabase';
import { ensureNotifyPermissions, sendInsightNotification, getLastInsightPushTs, setLastInsightPushTs } from '../lib/notify';

TaskManager.defineTask(TASK_HOURLY, async () => {
  try {
    await ensureNotifyPermissions();

    await flushHR().catch(()=>{});
    await flushAudioEvents().catch(()=>{});

    const dog = await getDogId();
    if (dog && hasSupabase()) {
      await computeCarBarkInsight(dog);
      await computeDogSeenHRInsight(dog);
      await computeNightWhineInsight(dog);
      await computeCarHRElevation(dog);
      await computePlayCalmInsight(dog);
      await computeStrangerStressInsight(dog);
      await computeRelaxInsight(dog);

      const last = await getLastInsightPushTs();
      const sinceIso = new Date(Math.max(last, Date.now() - 25*3600*1000)).toISOString();
      const { data } = await supabase
        .from('insights')
        .select('ts,category,summary,score')
        .eq('dog_id', dog)
        .gte('ts', sinceIso)
        .gte('score', 0.75)
        .order('ts', { ascending: false })
        .limit(3);
      if (data && data.length) {
        const first = data[0];
        await sendInsightNotification('High‑priority dog insight', `${first.summary}`);
        await setLastInsightPushTs(Date.now());
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (e) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerHourly() {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.BackgroundFetchStatus.Restricted || status === BackgroundFetch.BackgroundFetchStatus.Denied) {
    return false;
  }
  await BackgroundFetch.setMinimumIntervalAsync(60 * 60);
  await BackgroundFetch.registerTaskAsync(TASK_HOURLY, {
    stopOnTerminate: false,
    startOnBoot: true,
  });
  return true;
}
