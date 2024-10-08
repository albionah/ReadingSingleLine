import { LineIndexReader } from './LineIndexReader';
import { FilePartStreamReader } from '../FilePartStreamReader';
import { UINT64_SIZE } from './IndexConstants';
import { LineLocation } from './LineLocation';
import { FilePartReader } from '../FilePartReader';

export class LineIndexFileReader implements LineIndexReader {
    private readonly filePartReader: FilePartReader;

    public constructor(filePartReader: FilePartReader) {
        this.filePartReader = filePartReader;
    }

    public async getLineLocation(lineIndexNumber: number): Promise<LineLocation> {
        const startByte = lineIndexNumber * UINT64_SIZE;
        const endByte = startByte + (2 * UINT64_SIZE) - 1;
        const buffer: Buffer = await this.filePartReader.readFilePart(startByte, endByte);
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
