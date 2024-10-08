import { LineIndexReader } from './LineIndexReader';
import { UINT64_SIZE } from '../constants';
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
        } else if (buffer.length === 0) {
            throw new Error(`The line ${lineIndexNumber} is not in the file.`);
        } else {
            throw new Error('Index file is broken. Remove it and run this app again.');
        }
    }

    private transformBufferToLineLocation(buffer: Buffer): LineLocation {
        try {
            return {
                startByte: this.readUint64Number(buffer),
                nextLineStartByte: this.getNextLineStartByteIfNotLastLine(buffer)
            };
        } catch (error) {
            throw new Error(
                `It seems that index file is broken because unexpected error ` +
                `has occurred: "${error.message}". Remove it and run this app again.`
            );
        }
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
