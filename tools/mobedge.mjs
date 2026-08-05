import { PNG } from 'pngjs';
import { readFileSync } from 'node:fs';
for (const tag of ['orig','mine']) {
  const png = PNG.sync.read(readFileSync(`./diff/strip-${tag}-${process.argv[2]||390}.png`));
  const at=(x,y)=>{const i=(png.width*y+x)<<2;return [png.data[i],png.data[i+1],png.data[i+2]];};
  const dark=(x,y)=>{const [r,g,b]=at(x,y);return r<80&&g<80&&b<80;};
  console.log(`\n=== ${tag} ${process.argv[2]||390} ===  (검은바 왼끝)`);
  const out=[];
  for(let y=0;y<png.height;y++){
    let dl=-1; for(let x=120;x<png.width;x++) if(dark(x,y)){dl=x;break;}
    out.push(`${y}:${dl}`);
  }
  console.log('  '+out.join(' '));
}
