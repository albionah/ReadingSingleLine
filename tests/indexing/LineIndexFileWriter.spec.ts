import fsMock from 'mock-fs';
import { LineIndexFileWriter } from '../../src/indexing/LineIndexFileWriter';
import { LineIndexWriter } from '../../src/indexing/LineIndexWriter';
import fs from 'fs';
import fsAsync from 'fs/promises';
import { UINT64_SIZE } from '../../src/constants';
import { WriteStream } from 'node:fs';

function closeIndexFileStream(indexFileStream: WriteStream): Promise<void> {
    return new Promise((resolve): void => {
        indexFileStream.close(() => resolve());
    });
}

describe('LineIndexFileWriter', () => {
    const fileName = 'file.txt.idx';

    beforeEach(() => {
        fsMock();
    });

    describe('when pushBack is called', () => {
        it('should write index file to filesystem with the correct length and byte sequence', async () => {
            const indexFileStream: WriteStream = fs.createWriteStream(fileName);
            const lineIndexWriter: LineIndexWriter = new LineIndexFileWriter(indexFileStream);
            await lineIndexWriter.pushBack(0);
            await lineIndexWriter.pushBack(10);
            await lineIndexWriter.pushBack(100);
            await closeIndexFileStream(indexFileStream);
            const buffer: Buffer = await fsAsync.readFile(fileName);
            const expectedBuffer: Buffer = Buffer.alloc(24);
            expectedBuffer.writeBigUInt64LE(BigInt(0));
            expectedBuffer.writeBigUInt64LE(BigInt(10), UINT64_SIZE);
            expectedBuffer.writeBigUInt64LE(BigInt(100), 2 * UINT64_SIZE);
            expect(buffer).toEqual(expectedBuffer);
        });
    });
});
