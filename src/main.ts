import { FilePartStreamReader } from './FilePartStreamReader';
import { CliParser } from './CliParser';
import { LineGetter } from './LineGetter';
import fs from 'fs';
import { LineIndexBuilder } from './Index/LineIndexBuilder';
import { LineIndexReader } from './Index/LineIndexReader';
import { LineIndexWriter } from './Index/LineIndexWriter';
import { LineIndexFileReader } from './Index/LineIndexFileReader';
import { LineIndexFileWriterFactory } from './Index/LineIndexFileWriterFactory';
import { FilePartReader } from './FilePartReader';
import { Parameters } from './Parameters';

function verifyIfFileExists(pathToFile: string): void {
    if (!fs.existsSync(pathToFile)) {
        throw new Error(`File "${pathToFile}" does not exist.`);
    }
}

async function buildIndexFileIfNotExists(indexFileName: string, filePartReader: FilePartReader): Promise<void> {
    if (!fs.existsSync(indexFileName)) {
        console.debug(`Writing index to ${indexFileName}...`);
        const lineIndex: LineIndexWriter = LineIndexFileWriterFactory.build(indexFileName);
        const lineIndexBuilder: LineIndexBuilder = new LineIndexBuilder(filePartReader, lineIndex);
        await lineIndexBuilder.buildLineIndex();
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
    }
}

void main();
