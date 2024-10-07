import { LineIndexReader } from './LineIndexReader';
import { FileStreamPartReader } from '../FileStreamPartReader';
import { UINT64_SIZE } from './IndexConstants';
import { LineLocation } from './LineLocation';

export class LineIndexFileReader implements LineIndexReader {
    private readonly pathToFile: string;

    public constructor(pathToFile: string) {
        this.pathToFile = pathToFile;
    }

    public async getLineLocation(lineNumber: number): Promise<LineLocation> {
        const filePartReader = new FileStreamPartReader(this.pathToFile);
        const startByte = lineNumber * UINT64_SIZE;
        const endByte = startByte + (2 * UINT64_SIZE) - 1;
        const buffer = await filePartReader.readFilePart(startByte, endByte);
        if (buffer.length === 2 * UINT64_SIZE || buffer.length === UINT64_SIZE) {
            return this.transformBufferToLineLocation(buffer);
        } else {
            throw new Error('Index file is broken. Remove it and run it again.');
        }
    }

    private transformBufferToLineLocation(buffer: Buffer): LineLocation {
        return {
            startByte: this.readUint64Number(buffer),
            nextLineStartByte: this.getNextLineStartByteIfNotLastLine(buffer)
        };
    }

    private getNextLineStartByteIfNotLastLine(buffer: Buffer): number | undefined {
        if (buffer.length === 2 * UINT64_SIZE) {
            return this.readUint64Number(buffer.subarray(UINT64_SIZE));
        }
        return undefined;
    }

    private readUint64Number(buffer: Buffer): number {
        const uint64: bigint = buffer.readBigUInt64LE();
        if (uint64 > Number.MAX_SAFE_INTEGER) {
            throw new Error(`Cannot convert ${uint64} to number`);
        }
        return Number(uint64);
    }
}
