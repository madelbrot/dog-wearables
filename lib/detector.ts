import { Audio } from 'expo-av';
import { enqueueAudioEvent } from './upload';
import { getDogId } from './prefs';

export type DetectorMode = 'sim' | 'mic';

let running = false;
let interval: any;
let recording: Audio.Recording | null = null;

export async function startDetector(mode: DetectorMode = 'sim') {
  if (running) return { stop };
  running = true;

  if (mode === 'mic') {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) return startDetector('sim');
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    recording = new Audio.Recording();
    try {
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      // @ts-ignore (metering availability varies)
      recording.setProgressUpdateInterval(250);
      await recording.startAsync();
    } catch {
      return startDetector('sim');
    }
    interval = setInterval(async () => {
      if (!recording) return;
      try {
        const status = await recording.getStatusAsync();
        // @ts-ignore
        const meter: number | undefined = (status as any).metering;
        const loud = typeof meter === 'number' ? meter > -10 : Math.random() < 0.05;
        if (loud) {
          const dog = await getDogId();
          if (dog) enqueueAudioEvent({ dog_id: dog, ts: new Date().toISOString(), type: Math.random() < 0.7 ? 'bark' : 'whine', confidence: 0.8 });
        }
      } catch {}
    }, 500);
  } else {
    // Simulated
    let burst = 0;
    interval = setInterval(async () => {
      if (burst > 0 || Math.random() < 0.12) {
        burst = burst > 0 ? burst - 1 : Math.floor(2 + Math.random() * 4);
        const dog = await getDogId();
        if (dog) enqueueAudioEvent({ dog_id: dog, ts: new Date().toISOString(), type: Math.random() < 0.75 ? 'bark' : 'whine', confidence: 0.7 + Math.random() * 0.25 });
      }
    }, 600);
  }
  return { stop };
}

export async function stop() {
  running = false;
  if (interval) clearInterval(interval);
  interval = null;
  if (recording) {
    try { await recording.stopAndUnloadAsync(); } catch {}
    recording = null;
  }
}
