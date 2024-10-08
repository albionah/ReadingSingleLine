import * as fs from 'fs';
import * as path from 'path';
import { WriteStream } from 'node:fs';

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const pathToFile = path.join(process.cwd(), 'generatedFile.txt');
const numberOfLines = 10000000;

function generateRandomLine(): string {
    const length = Math.floor(Math.random() * 1001);
    let result = '';
    for (let j = 0; j < length; j++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function waitOnDrain(stream: WriteStream): Promise<void> {
    return new Promise((resolve) => {
        stream.once('drain', () => {
            resolve();
        });
    });
}

async function generateRandomFile(): Promise<void> {
    const stream = fs.createWriteStream(pathToFile);
    for (let j = 0; j < numberOfLines; j++) {
        const isBufferSufficientlyFree = stream.write(`${generateRandomLine()}\n`);
        if (!isBufferSufficientlyFree) {
            await waitOnDrain(stream);
        }
        if (j % 100000 === 0 && j > 0) {
            console.debug(`${j}/${numberOfLines} (${Math.round((j / numberOfLines) * 100)} %) lines were written to the file`);
        }
    }
}

async function main() {
    try {
        await generateRandomFile();
        console.log(`File "${pathToFile}" was successfully generated with ${numberOfLines} lines.`);
    } catch (error) {
        console.error(error.message);
    }
}

void main();
