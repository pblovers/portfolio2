// 저장소 루트를 스스로 계산한다. PC·OS 가 바뀌어도 경로를 손댈 필요 없다.
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const mine = (file) => pathToFileURL(join(ROOT, file)).href;
