import { LineIndexWriter } from './LineIndexWriter';
import fs from 'fs/promises';
import { UINT64_SIZE } from './IndexConstants';

export class LineIndexFileWriter implements LineIndexWriter {
    private readonly pathToFile: string;

    public constructor(pathToFile: string) {
        this.pathToFile = pathToFile;
    }

    public async pushBack(startByte: number): Promise<void> {
        const buffer: Buffer = Buffer.alloc(UINT64_SIZE);
        buffer.writeBigUInt64LE(BigInt(startByte));
        await fs.appendFile(this.pathToFile, buffer);
    }
}
