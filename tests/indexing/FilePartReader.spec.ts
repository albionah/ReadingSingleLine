import { FilePartReader } from '../../src/FilePartReader';
import createSpyObj = jasmine.createSpyObj;
import { LineIndexFileReader } from '../../src/indexing/LineIndexFileReader';
import { UINT64_SIZE } from '../../src/constants';

describe('LineIndexFileReader', () => {
    describe('when getLineLocation is called', () => {
        let filePartReader: jasmine.SpyObj<FilePartReader>;

        beforeEach(() => {
            filePartReader = createSpyObj(['readFilePart', 'readFilePartByPart']);
        });

        describe('and when it is not the last line', () => {
            const startByte = 123;
            const nextLineStartByte = 234;

            let buffer: Buffer;

            beforeEach(() => {
                buffer = Buffer.alloc(UINT64_SIZE * 2);
                buffer.writeBigUInt64LE(BigInt(startByte));
                buffer.writeBigUInt64LE(BigInt(nextLineStartByte), UINT64_SIZE);
            });

            it('should get both startByte and nextLineStartByte', async () => {
                filePartReader.readFilePart.and.resolveTo(buffer);
                const lineIndexReader = new LineIndexFileReader(filePartReader);
                await expectAsync(lineIndexReader.getLineLocation(0)).toBeResolvedTo({
                    startByte,
                    nextLineStartByte
                });
            });

            it('should read numbers from the index file in correct range', async () => {
                filePartReader.readFilePart.and.resolveTo(buffer);
                const lineIndexReader = new LineIndexFileReader(filePartReader);
                await lineIndexReader.getLineLocation(0);
                expect(filePartReader.readFilePart).toHaveBeenCalledOnceWith(0, 2 * UINT64_SIZE - 1)
            });
        });

        describe('and when it is the last line', () => {
            const startByte = 123;

            let buffer: Buffer;

            beforeEach(() => {
                buffer = Buffer.alloc(UINT64_SIZE);
                buffer.writeBigUInt64LE(BigInt(startByte));
            });

            it('should get both startByte and nextLineStartByte', async () => {
                filePartReader.readFilePart.and.resolveTo(buffer);
                const lineIndexReader = new LineIndexFileReader(filePartReader);
                await expectAsync(lineIndexReader.getLineLocation(0)).toBeResolvedTo({
                    startByte,
                    nextLineStartByte: undefined
                });
            });

            it('should read numbers from the index file in correct range', async () => {
                filePartReader.readFilePart.and.resolveTo(buffer);
                const lineIndexReader = new LineIndexFileReader(filePartReader);
                await lineIndexReader.getLineLocation(0);
                expect(filePartReader.readFilePart).toHaveBeenCalledOnceWith(0, 2 * UINT64_SIZE - 1)
            });
        });

        describe('and when the line number is not in the index', () => {
            const buffer: Buffer = Buffer.from([]);

            it('should be rejected', async () => {
                filePartReader.readFilePart.and.resolveTo(buffer);
                const lineIndexReader = new LineIndexFileReader(filePartReader);
                await expectAsync(lineIndexReader.getLineLocation(0))
                    .toBeRejectedWithError(`The line ${0} is not in the file.`);
            });
        });

        describe('and when the number of bytes which are read in the index file is not 16 nor 8 nor 0', () => {
            const buffer: Buffer = Buffer.alloc(1);

            it('should be rejected', async () => {
                filePartReader.readFilePart.and.resolveTo(buffer);
                const lineIndexReader = new LineIndexFileReader(filePartReader);
                await expectAsync(lineIndexReader.getLineLocation(0))
                    .toBeRejectedWithError('Index file is broken. Remove it and run this app again.');
            });
        });
    });
});
