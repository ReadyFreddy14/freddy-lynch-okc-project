import assert from 'node:assert/strict';
import fs from 'node:fs';
import {makeModel,isThree} from './model.js';
const data=JSON.parse(fs.readFileSync(new URL('./data.json',import.meta.url),'utf8'));
assert.equal(data.players.length,582);assert.equal(new Set(data.players.map(p=>p.id)).size,582);
for(const p of data.players){assert.equal(p.shots.length,p.fga);assert.equal(p.shots.reduce((a,s)=>a+s[2],0),p.fgm);assert.ok(p.height>1.5&&p.height<2.5);}
assert.equal(isThree(0,20),false);assert.equal(isThree(23,0),true);assert.equal(isThree(0,24),true);
const model=makeModel(data),curry=data.players.find(p=>p.name==='Stephen Curry'),wemby=data.players.find(p=>p.name==='Victor Wembanyama');
for(const x of [-24,0,24])for(const y of [-4,0,10,24,47,88])for(const pressure of ['open','moderate','tight']){const e=model.estimate(curry,wemby,x,y,pressure);assert.ok(Number.isFinite(e.p)&&e.p>=.01&&e.p<=.95);assert.ok(e.local.m<=e.local.n);}
const open=model.estimate(curry,wemby,0,25,'open'),tight=model.estimate(curry,wemby,0,25,'tight');assert.ok(open.p>tight.p);assert.ok(model.estimate(curry,wemby,0,85,'moderate').extrapolated);
assert.ok(model.estimate(curry,wemby,0,85,'moderate').p<model.estimate(curry,wemby,0,25,'moderate').p);
console.log('PASS: all 582 player totals match shot records; court boundaries, sparse samples, defensive pressure and long-range estimates verified.');

const {aggregate,zoneAt,heat}=await import('./hotzones.js');
for(const p of data.players){const zs=Object.values(aggregate(p.shots));assert.equal(zs.reduce((n,z)=>n+z.n,0),p.fga);assert.equal(zs.reduce((n,z)=>n+z.m,0),p.fgm);}
assert.equal(zoneAt(0,0),'rim');assert.equal(zoneAt(-23,2),'cornerL');assert.equal(zoneAt(0,36),'deep');assert.equal(zoneAt(0,25),'top');assert.equal(heat({m:0,n:0},{m:5,n:10}),'No attempts');assert.equal(heat({m:9,n:10},{m:50,n:100}),'Small sample');assert.equal(heat({m:18,n:20},{m:50,n:100}),'Lethal');assert.equal(heat({m:4,n:20},{m:50,n:100}),'Cold');
console.log('PASS: hot-zone counts and makes reconcile for every player; boundaries and sparse-data labels verified.');
