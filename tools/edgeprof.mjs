import { PNG } from 'pngjs';
import { readFileSync } from 'node:fs';
const W = process.argv[2] || 1997;
for (const tag of ['orig','mine']) {
  const png = PNG.sync.read(readFileSync(`./diff/strip-${tag}-${W}.png`));
  const at=(x,y)=>{const i=(png.width*y+x)<<2;return [png.data[i],png.data[i+1],png.data[i+2]];};
  const dark=(x,y)=>{const [r,g,b]=at(x,y);return r<80&&g<80&&b<80;};
  const yellow=(x,y)=>{const [r,g,b]=at(x,y);return r>200&&g>170&&b<130;};
  const rows=[];
  for(let y=0;y<png.height;y++){
    let dl=-1; for(let x=Math.round(png.width*0.55);x<png.width;x++) if(dark(x,y)){dl=x;break;}
    let yr=-1; for(let x=1100;x>=0;x--) if(yellow(x,y)){yr=x;break;}
    rows.push({y,dl,yr});
  }
  const band=rows.filter(r=>r.yr>0);
  console.log(`\n=== ${tag} ===  노란탭 있는 행: ${band[0]?.y}~${band[band.length-1]?.y}`);
  console.log('  y : 노랑오른끝 / 검은바왼끝');
  rows.slice(0,44).forEach(r=>console.log(`  ${String(r.y).padStart(2)} : ${String(r.yr).padStart(5)} / ${String(r.dl).padStart(5)}`));
}
