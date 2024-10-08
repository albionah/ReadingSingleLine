import createSpyObj = jasmine.createSpyObj;
import { LineIndexReader } from '../src/indexing/LineIndexReader';
import { FilePartReader } from '../src/FilePartReader';
import { LineGetter } from '../src/LineGetter';

describe('LineGetter', () => {
    describe('when getLine is called', () => {
        const content = 'this is a single line';
        const bufferWithContent = Buffer.from(`${content}\r\n`);
        const startByte = 123;
        const nextLineStartByte = 555;
        const lineIndexNumber = 1;

        let filePartReader: jasmine.SpyObj<FilePartReader>;
        let lineIndexReader: jasmine.SpyObj<LineIndexReader>;

        beforeEach(() => {
            filePartReader = createSpyObj(['readFilePart', 'readFilePartByPart']);
            lineIndexReader = createSpyObj(['getLineLocation']);
        });

        it('should get the line without new line characters', async () => {
            filePartReader.readFilePart.and.resolveTo(bufferWithContent);
            lineIndexReader.getLineLocation.and.resolveTo({startByte, nextLineStartByte});
            const lineGetter: LineGetter = new LineGetter(filePartReader, lineIndexReader);
            await expectAsync(lineGetter.getLine(lineIndexNumber)).toBeResolvedTo(content);
        });

        it('should call getLineLocation method with the index', async () => {
            filePartReader.readFilePart.and.resolveTo(bufferWithContent);
            lineIndexReader.getLineLocation.and.resolveTo({startByte, nextLineStartByte});
            const lineGetter: LineGetter = new LineGetter(filePartReader, lineIndexReader);
            await lineGetter.getLine(lineIndexNumber);
            expect(lineIndexReader.getLineLocation).toHaveBeenCalledOnceWith(1);
        });

        it('should call readFilePart method with the correct byte range', async () => {
            filePartReader.readFilePart.and.resolveTo(bufferWithContent);
            lineIndexReader.getLineLocation.and.resolveTo({startByte, nextLineStartByte});
            const lineGetter: LineGetter = new LineGetter(filePartReader, lineIndexReader);
            await lineGetter.getLine(lineIndexNumber);
            expect(filePartReader.readFilePart).toHaveBeenCalledOnceWith(startByte, nextLineStartByte - 1);
        });

        describe('and when there is no nextLineStartByte', () => {
            it('should get the last line without new line characters', async () => {
                filePartReader.readFilePart.and.resolveTo(bufferWithContent);
                lineIndexReader.getLineLocation.and.resolveTo({startByte});
                const lineGetter: LineGetter = new LineGetter(filePartReader, lineIndexReader);
                await expectAsync(lineGetter.getLine(lineIndexNumber)).toBeResolvedTo(content);
            });

            it('should call readFilePart method only with start byte', async () => {
                filePartReader.readFilePart.and.resolveTo(bufferWithContent);
                lineIndexReader.getLineLocation.and.resolveTo({startByte});
                const lineGetter: LineGetter = new LineGetter(filePartReader, lineIndexReader);
                await lineGetter.getLine(lineIndexNumber);
                expect(filePartReader.readFilePart).toHaveBeenCalledOnceWith(startByte);
            });
        });
    });
});
