import fs from 'fs';

const content = fs.readFileSync('src/lib/i18n.ts', 'utf8');

let open = 0;
let line = 1;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') open++;
    if (content[i] === '}') open--;

    if (content[i] === '\n') {
        if ([314, 380, 460, 480, 512, 542, 566, 618, 624, 675, 681, 682].includes(line)) {
            console.log(`Line ${line}: open=${open}`);
        }
        line++;
    }
}
