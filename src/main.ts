import { FilePartReader, FileStreamPartReader } from './FileStreamPartReader';
import { CliParser, Parameters } from './CliParser';
import { LineGetter } from './LineGetter';
import fs from 'fs';
import { LineIndexBuilder } from './LineIndexBuilder';
import { LineIndexReader } from './Index/LineIndexReader';
import { LineIndexWriter } from './Index/LineIndexWriter';
import { LineIndexFileWriter } from './Index/LineIndexFileWriter';
import { LineIndexFileReader } from './Index/LineIndexFileReader';

async function buildIndexFileIfNotExists(indexFileName: string, filePartReader: FilePartReader): Promise<void> {
    if (!fs.existsSync(indexFileName)) {
        const lineIndex: LineIndexWriter = new LineIndexFileWriter(indexFileName);
        const lineIndexBuilder: LineIndexBuilder = new LineIndexBuilder(filePartReader, lineIndex);
        await lineIndexBuilder.buildLineIndex();
    }
}

async function main(): Promise<void> {
    try {
        const { pathToFile, lineIndexNumber }: Parameters = CliParser.parse(process.argv);
        const indexFileName = `${pathToFile}.idx`;
        const filePartReader: FilePartReader = new FileStreamPartReader(pathToFile);
        await buildIndexFileIfNotExists(indexFileName, filePartReader);
        const lineIndex: LineIndexReader = new LineIndexFileReader(indexFileName);
        const lineGetter: LineGetter = new LineGetter(filePartReader, lineIndex);
        const line: string = await lineGetter.getLine(pathToFile, lineIndexNumber);
        console.log(line);
    } catch (error) {
        console.error(error.message);
    }
}

void main();
