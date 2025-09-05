import { supabase, hasSupabase } from './supabase';

export async function computeCarBarkInsight(dogId: string) {
  if (!hasSupabase()) return { created: false as const, reason: 'no supabase' };
  const since = new Date(Date.now() - 24*3600*1000).toISOString();

  const { data: cars } = await supabase
    .from('user_events').select('ts')
    .eq('dog_id', dogId).eq('type','Car').gte('ts', since).order('ts', { ascending: true });
  if (!cars?.length) return { created: false as const, reason: 'no car events' };

  const { data: audio } = await supabase
    .from('events_audio').select('ts,type')
    .eq('dog_id', dogId).gte('ts', since).order('ts', { ascending: true });
  if (!audio) return { created: false as const, reason: 'audio error' };

  const toMs = (s: any) => new Date(s).getTime();
  const AHEAD = 60*60*1000, BEHIND = 60*60*1000;
  let totalPost = 0, totalPre = 0, n = 0;
  for (const c of cars) {
    const t = toMs(c.ts as any);
    const pre = audio.filter(a => toMs(a.ts as any) >= t - BEHIND && toMs(a.ts as any) < t);
    const post = audio.filter(a => toMs(a.ts as any) >= t && toMs(a.ts as any) < t + AHEAD);
    totalPre += pre.length; totalPost += post.length; n++;
  }
  if (!n) return { created: false as const, reason: 'no windows' };

  const preRate = totalPre / n, postRate = totalPost / n;
  const ratio = preRate === 0 ? (postRate > 0 ? Infinity : 1) : postRate / preRate;
  if (postRate >= preRate + 3 && ratio >= 2) {
    const summary = `Barking increases for ~60 min after car rides (${postRate.toFixed(1)}/h vs ${preRate.toFixed(1)}/h baseline).`;
    const details = { windows: n, postRate, preRate, ratio };
    await supabase.from('insights').upsert({
      dog_id: dogId, category: 'car_bark_risk', summary, score: Math.min(1, Math.max(0.5, Math.tanh((ratio-1)))), details_json: details as any
    }, { onConflict: 'dog_id,category' });
    return { created: true as const, summary };
  }
  return { created: false as const, reason: 'no significant lift', preRate, postRate, ratio };
}

export async function computeDogSeenHRInsight(dogId: string) {
  if (!hasSupabase()) return { created: false as const };
  const since = new Date(Date.now() - 24*3600*1000).toISOString();
  const { data: seen } = await supabase.from('user_events').select('ts')
    .eq('dog_id', dogId).eq('type','Dog Seen').gte('ts', since);
  if (!seen?.length) return { created:false as const };
  const { data: hr } = await supabase.from('samples_hr').select('ts,bpm')
    .eq('dog_id', dogId).gte('ts', since);
  if (!hr) return { created:false as const };
  const toMs=(s:any)=>new Date(s).getTime(); const WINDOW=15*60*1000;
  let deltas:number[]=[];
  for(const e of seen){
    const t=toMs(e.ts as any);
    const pre=hr.filter(h=>toMs(h.ts as any)<t && toMs(h.ts as any)>=t-WINDOW);
    const post=hr.filter(h=>toMs(h.ts as any)>=t && toMs(h.ts as any)<t+WINDOW);
    if(!pre.length||!post.length) continue;
    const preAvg=pre.reduce((a,b)=>a+b.bpm,0)/pre.length;
    const postAvg=post.reduce((a,b)=>a+b.bpm,0)/post.length;
    deltas.push(postAvg-preAvg);
  }
  if(!deltas.length) return { created:false as const };
  const avgDelta=deltas.reduce((a,b)=>a+b,0)/deltas.length;
  if(avgDelta>10){
    const summary=`Heart rate increases by ~${avgDelta.toFixed(1)} bpm for 15 min after seeing another dog.`;
    await supabase.from('insights').upsert({
      dog_id:dogId, category:'dogseen_hr', summary, score:Math.min(1,avgDelta/30), details_json:{avgDelta}
    },{onConflict:'dog_id,category'});
    return {created:true as const, summary};
  }
  return {created:false as const};
}

export async function computeNightWhineInsight(dogId:string){
  if(!hasSupabase()) return {created:false as const};
  const since=new Date(Date.now()-7*24*3600*1000).toISOString();
  const {data}=await supabase.from('events_audio').select('ts,type').eq('dog_id',dogId).eq('type','whine').gte('ts',since);
  if(!data?.length)return {created:false as const};
  const hours=data.map(d=>new Date(d.ts as any).getHours());
  const night=hours.filter(h=>h>=22||h<6).length;
  const day=hours.length-night;
  if(night>=day && night>=5){
    const summary=`Whining occurs more often at night (22:00–06:00), suggesting sleep or comfort issues.`;
    await supabase.from('insights').upsert({
      dog_id:dogId, category:'night_whine', summary, score:0.7, details_json:{night,day}
    },{onConflict:'dog_id,category'});
    return {created:true as const, summary};
  }
  return {created:false as const};
}

export async function computeCarHRElevation(dogId:string){
  if(!hasSupabase()) return {created:false as const};
  const since=new Date(Date.now()-24*3600*1000).toISOString();
  const {data:cars}=await supabase.from('user_events').select('ts').eq('dog_id',dogId).eq('type','Car').gte('ts',since);
  if(!cars?.length)return {created:false as const};
  const {data:hr}=await supabase.from('samples_hr').select('ts,bpm').eq('dog_id',dogId).gte('ts',since);
  if(!hr)return {created:false as const};
  const toMs=(s:any)=>new Date(s).getTime(); const DUR=20*60*1000;
  let lifts:number[]=[];
  for(const c of cars){
    const t=toMs(c.ts as any);
    const during=hr.filter(h=>toMs(h.ts as any)>=t&&toMs(h.ts as any)<t+DUR);
    const before=hr.filter(h=>toMs(h.ts as any)<t&&toMs(h.ts as any)>=t-DUR);
    if(!before.length||!during.length) continue;
    const pre=before.reduce((a,b)=>a+b.bpm,0)/before.length;
    const dur=during.reduce((a,b)=>a+b.bpm,0)/during.length;
    lifts.push(dur-pre);
  }
  if(lifts.length&&Math.max(...lifts)>15){
    const avg=lifts.reduce((a,b)=>a+b,0)/lifts.length;
    const summary=`Heart rate is elevated by ~${avg.toFixed(1)} bpm during car rides.`;
    await supabase.from('insights').upsert({dog_id:dogId,category:'car_hr',summary,score:Math.min(1,avg/40),details_json:{avg}}, {onConflict:'dog_id,category'});
    return {created:true as const, summary};
  }
  return {created:false as const};
}

export async function computePlayCalmInsight(dogId:string){
  const since=new Date(Date.now()-24*3600*1000).toISOString();
  const {data:plays}=await supabase.from('user_events').select('ts').eq('dog_id',dogId).in('type',['Play','Toy']).gte('ts',since);
  if(!plays?.length) return {created:false as const};
  const {data:hr}=await supabase.from('samples_hr').select('ts,bpm').eq('dog_id',dogId).gte('ts',since);
  if(!hr) return {created:false as const};
  const toMs=(s:any)=>new Date(s).getTime(); const DUR=30*60*1000; let diffs:number[]=[];
  for(const p of plays){
    const t=toMs(p.ts as any);
    const pre=hr.filter(h=>toMs(h.ts as any)<t&&toMs(h.ts as any)>=t-DUR);
    const post=hr.filter(h=>toMs(h.ts as any)>=t&&toMs(h.ts as any)<t+DUR);
    if(pre.length&&post.length){
      const preAvg=pre.reduce((a,b)=>a+b.bpm,0)/pre.length;
      const postAvg=post.reduce((a,b)=>a+b.bpm,0)/post.length;
      diffs.push(preAvg-postAvg);
    }
  }
  const avg=diffs.reduce((a,b)=>a+b,0)/(diffs.length||1);
  if(avg>5){
    const summary=`Play sessions reduce heart rate by ~${avg.toFixed(1)} bpm afterward, suggesting relaxation.`;
    await supabase.from('insights').upsert({dog_id:dogId,category:'play_calm',summary,score:0.3,details_json:{avg}},{onConflict:'dog_id,category'});
    return {created:true as const, summary};
  }
  return {created:false as const};
}

export async function computeStrangerStressInsight(dogId:string){
  const since=new Date(Date.now()-24*3600*1000).toISOString();
  const {data:newp}=await supabase.from('user_events').select('ts').eq('dog_id',dogId).eq('type','New Person').gte('ts',since);
  if(!newp?.length)return{created:false as const};
  const {data:audio}=await supabase.from('events_audio').select('ts').eq('dog_id',dogId).gte('ts',since);
  const {data:hr}=await supabase.from('samples_hr').select('ts,bpm').eq('dog_id',dogId).gte('ts',since);
  if(!audio||!hr)return{created:false as const};
  const toMs=(s:any)=>new Date(s).getTime(); const DUR=20*60*1000; let flagged=0;
  for(const e of newp){
    const t=toMs(e.ts as any);
    const barks=audio.filter(a=>toMs(a.ts as any)>=t&&toMs(a.ts as any)<t+DUR);
    const hrPost=hr.filter(h=>toMs(h.ts as any)>=t&&toMs(h.ts as any)<t+DUR);
    const hrPre=hr.filter(h=>toMs(h.ts as any)<t&&toMs(h.ts as any)>=t-DUR);
    const preAvg=hrPre.length?hrPre.reduce((a,b)=>a+b.bpm,0)/hrPre.length:0;
    const postAvg=hrPost.length?hrPost.reduce((a,b)=>a+b.bpm,0)/hrPost.length:0;
    if(barks.length>=3 || (postAvg-preAvg)>12){ flagged++; }
  }
  if(flagged){
    const summary=`Dog shows stress (barks or HR spike) within 20 min of meeting new people.`;
    await supabase.from('insights').upsert({dog_id:dogId,category:'stranger_stress',summary,score:0.8,details_json:{flagged}},{onConflict:'dog_id,category'});
    return {created:true as const, summary};
  }
  return{created:false as const};
}

export async function computeRelaxInsight(dogId:string){
  const since=new Date(Date.now()-24*3600*1000).toISOString();
  const {data:rels}=await supabase.from('user_events').select('ts').eq('dog_id',dogId).eq('type','Relaxing').gte('ts',since);
  if(!rels?.length)return{created:false as const};
  const {data:hr}=await supabase.from('samples_hr').select('ts,bpm').eq('dog_id',dogId).gte('ts',since);
  if(!hr)return{created:false as const};
  const toMs=(s:any)=>new Date(s).getTime(); const DUR=20*60*1000; let drops:number[]=[];
  for(const r of rels){
    const t=toMs(r.ts as any);
    const seg=hr.filter(h=>toMs(h.ts as any)>=t&&toMs(h.ts as any)<t+DUR);
    if(seg.length){
      const mean=seg.reduce((a,b)=>a+b.bpm,0)/seg.length;
      const varc=seg.reduce((a,b)=>a+(b.bpm-mean)**2,0)/seg.length;
      if(varc<25) drops.push(varc);
    }
  }
  if(drops.length){
    const summary=`Relaxation periods show stable heart rate (low variance), indicating calm state.`;
    await supabase.from('insights').upsert({dog_id:dogId,category:'relax_calm',summary,score:0.2,details_json:{samples:drops.length}},{onConflict:'dog_id,category'});
    return {created:true as const, summary};
  }
  return{created:false as const};
}
