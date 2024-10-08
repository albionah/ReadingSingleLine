import { FilePartStreamReader } from './FilePartStreamReader';
import { CliParser } from './CliParser';
import { LineGetter } from './LineGetter';
import fs from 'fs';
import { LineIndexBuilder } from './indexing/LineIndexBuilder';
import { LineIndexReader } from './indexing/LineIndexReader';
import { LineIndexWriter } from './indexing/LineIndexWriter';
import { LineIndexFileReader } from './indexing/LineIndexFileReader';
import { FilePartReader } from './FilePartReader';
import { Parameters } from './Parameters';
import { MEGABYTE } from './constants';
import { WriteStream } from 'node:fs';
import { LineIndexFileWriter } from './indexing/LineIndexFileWriter';

function verifyIfFileExists(pathToFile: string): void {
    if (!fs.existsSync(pathToFile)) {
        throw new Error(`File "${pathToFile}" does not exist.`);
    }
}

async function closeStream(stream: WriteStream): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        stream.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

function createIndexFileStream(indexFileName: string): WriteStream {
    const indexFileStream: WriteStream = fs.createWriteStream(indexFileName, {
        highWaterMark: 10 * MEGABYTE
    });
    indexFileStream.on('error', (error: Error) => {
        console.error(`An error occurred on the stream to index file: ${error.message}}`);
        process.exit(3);
    });
    return indexFileStream;
}

async function buildIndexFileIfNotExists(indexFileName: string, filePartReader: FilePartReader): Promise<void> {
    if (!fs.existsSync(indexFileName)) {
        console.debug(`Writing index to ${indexFileName}...`);
        const indexFileStream: WriteStream = createIndexFileStream(indexFileName);
        const lineIndex: LineIndexWriter = new LineIndexFileWriter(indexFileStream);
        const lineIndexBuilder: LineIndexBuilder = new LineIndexBuilder(filePartReader, lineIndex);
        await lineIndexBuilder.buildLineIndex();
        await closeStream(indexFileStream);
        console.debug(`done`);
    }
}

async function main(): Promise<void> {
    try {
        const { pathToFile, lineIndexNumber }: Parameters = CliParser.parse(process.argv);
        verifyIfFileExists(pathToFile);
        const indexFileName = `${pathToFile}.idx`;
        const textFilePartReader: FilePartReader = new FilePartStreamReader(pathToFile);
        await buildIndexFileIfNotExists(indexFileName, textFilePartReader);
        const indexFilePartReader: FilePartReader = new FilePartStreamReader(indexFileName);
        const lineIndex: LineIndexReader = new LineIndexFileReader(indexFilePartReader);
        const lineGetter: LineGetter = new LineGetter(textFilePartReader, lineIndex);
        const line: string = await lineGetter.getLine(lineIndexNumber);
        console.log(line);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('Interrupting...');
    process.exit(2);
});

void main();
