import { LineIndexWriter } from './LineIndexWriter';
import { WriteStream } from 'node:fs';
import fs from 'fs';
import { LineIndexFileWriter } from './LineIndexFileWriter';

export class LineIndexFileWriterFactory {
    public static build(pathToFile: string): LineIndexWriter {
        const stream: WriteStream = fs.createWriteStream(pathToFile);
        return new LineIndexFileWriter(stream);
    }
}

