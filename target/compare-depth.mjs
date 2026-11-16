import {chromium} from '@playwright/test'
import {readFile} from 'node:fs/promises'
const dir='target/story-depth-results/story-dinosaur-flight-all--9c58c-d-visit-every-habitat-1280--chromium/'
const inputs=await Promise.all(['handoff-before.png','handoff-after.png'].map(async n=>(await readFile(dir+n)).toString('base64')))
const b=await chromium.launch();const p=await b.newPage()
console.log(await p.evaluate(async inputs=>{
const images=await Promise.all(inputs.map(async input=>{const i=new Image();i.src='data:image/png;base64,'+input;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);return {w:i.width,h:i.height,data:ctx.getImageData(0,0,i.width,i.height).data}}));
const[a,b]=images;const regions=[];
for(let y0=0;y0<5;y0++)for(let x0=0;x0<5;x0++) {let sum=0,n=0;for(let y=Math.floor(a.h*y0/5);y<Math.floor(a.h*(y0+1)/5);y++)for(let x=Math.floor(a.w*x0/5);x<Math.floor(a.w*(x0+1)/5);x++){const i=(y*a.w+x)*4; for(let c=0;c<3;c++){sum+=Math.abs(a.data[i+c]-b.data[i+c]);n++}}regions.push([x0,y0,+(sum/n).toFixed(2)])};return regions
},inputs));await b.close()
