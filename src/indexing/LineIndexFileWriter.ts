import { LineIndexWriter } from './LineIndexWriter';
import { UINT64_SIZE } from '../constants';
import { WriteStream } from 'node:fs';

export class LineIndexFileWriter implements LineIndexWriter {
    private readonly fileStream: WriteStream;

    public constructor(fileStream: WriteStream) {
        this.fileStream = fileStream;
    }

    public pushBack(startByte: number): Promise<void> {
        const buffer: Buffer = Buffer.alloc(UINT64_SIZE);
        buffer.writeBigUInt64LE(BigInt(startByte));
        return this.writeToFile(buffer);
    }

    private writeToFile(buffer: Buffer): Promise<void> {
        return new Promise((resolve) => {
            const isBufferSufficientlyFree = this.fileStream.write(buffer);
            if (isBufferSufficientlyFree) {
                resolve();
            } else {
                this.fileStream.once('drain', resolve);
            }
        });
    }
}
