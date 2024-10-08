import { LineIndexBuilder } from '../../src/indexing/LineIndexBuilder';
import { FilePartReader } from '../../src/FilePartReader';
import { LineIndexWriter } from '../../src/indexing/LineIndexWriter';
import createSpyObj = jasmine.createSpyObj;

describe('LineIndexBuilder', () => {
    let filePartReader: jasmine.SpyObj<FilePartReader>;
    let lineIndexWriter: jasmine.SpyObj<LineIndexWriter>;

    beforeEach(() => {
        filePartReader = createSpyObj(['readFilePart', 'readFilePartByPart']);
        lineIndexWriter = createSpyObj(['pushBack']);
    });

    describe('when buildLineIndex is called', () => {
        const content = 'hello\r\nbonjour\r\nhola\r\nsalve';

        it('should call readFilePartByPart', async () => {
            filePartReader.readFilePartByPart.and.callFake(async function* () {
                yield Buffer.from(content);
            });
            const fileLineReader = new LineIndexBuilder(filePartReader, lineIndexWriter);
            await expectAsync(fileLineReader.buildLineIndex()).toBeResolved();
            expect(filePartReader.readFilePartByPart).toHaveBeenCalled();
        });

        describe('and when file contains multi-byte characters', () => {
            const multibyteContent = 'hello\r\nNǐn hǎo\r\nčau\r\nOlá';

            it('should push back each line to the index', async () => {
                filePartReader.readFilePartByPart.and.callFake(async function* () {
                    yield Buffer.from(multibyteContent);
                });
                const fileLineReader = new LineIndexBuilder(filePartReader, lineIndexWriter);
                await expectAsync(fileLineReader.buildLineIndex()).toBeResolved();
                expect(lineIndexWriter.pushBack).toHaveBeenCalledTimes(4);
                expect(lineIndexWriter.pushBack.calls.argsFor(0)).toEqual([0]);
                expect(lineIndexWriter.pushBack.calls.argsFor(1)).toEqual([7]);
                expect(lineIndexWriter.pushBack.calls.argsFor(2)).toEqual([18]);
                expect(lineIndexWriter.pushBack.calls.argsFor(3)).toEqual([24]);
            });
        });

        describe('and when lines are separated by CR + LF', () => {
            const linesSeparatedByCrLf = 'hello\r\nbonjour\r\nhola';

            it('should push back each line to the index', async () => {
                filePartReader.readFilePartByPart.and.callFake(async function* () {
                    yield Buffer.from(linesSeparatedByCrLf);
                });
                const fileLineReader = new LineIndexBuilder(filePartReader, lineIndexWriter);
                await expectAsync(fileLineReader.buildLineIndex()).toBeResolved();
                expect(lineIndexWriter.pushBack).toHaveBeenCalledTimes(3);
                expect(lineIndexWriter.pushBack.calls.argsFor(0)).toEqual([0]);
                expect(lineIndexWriter.pushBack.calls.argsFor(1)).toEqual([7]);
                expect(lineIndexWriter.pushBack.calls.argsFor(2)).toEqual([16]);
            });
        });

        describe('and when lines are separated by LF', () => {
            const linesSeparatedByLf = 'hello\nbonjour\nhola';

            it('should push back each line to the index', async () => {
                filePartReader.readFilePartByPart.and.callFake(async function* () {
                    yield Buffer.from(linesSeparatedByLf);
                });
                const fileLineReader = new LineIndexBuilder(filePartReader, lineIndexWriter);
                await expectAsync(fileLineReader.buildLineIndex()).toBeResolved();
                expect(lineIndexWriter.pushBack).toHaveBeenCalledTimes(3);
                expect(lineIndexWriter.pushBack.calls.argsFor(0)).toEqual([0]);
                expect(lineIndexWriter.pushBack.calls.argsFor(1)).toEqual([6]);
                expect(lineIndexWriter.pushBack.calls.argsFor(2)).toEqual([14]);
            });
        });

        describe('and when lines are separated by CR', () => {
            const linesSeparatedByCr = 'hello\rbonjour\rhola';

            it('should push back each line to the index', async () => {
                filePartReader.readFilePartByPart.and.callFake(async function* () {
                    yield Buffer.from(linesSeparatedByCr);
                });
                const fileLineReader = new LineIndexBuilder(filePartReader, lineIndexWriter);
                await expectAsync(fileLineReader.buildLineIndex()).toBeResolved();
                expect(lineIndexWriter.pushBack).toHaveBeenCalledTimes(3);
                expect(lineIndexWriter.pushBack.calls.argsFor(0)).toEqual([0]);
                expect(lineIndexWriter.pushBack.calls.argsFor(1)).toEqual([6]);
                expect(lineIndexWriter.pushBack.calls.argsFor(2)).toEqual([14]);
            });
        });

        describe('and when there is a new line separator at the end of the content', () => {
            const contentWithNewLineAtTheEnd = 'hello\r\nbonjour\r\n';

            it('should push back each line to the index', async () => {
                filePartReader.readFilePartByPart.and.callFake(async function* () {
                    yield Buffer.from(contentWithNewLineAtTheEnd);
                });
                const fileLineReader = new LineIndexBuilder(filePartReader, lineIndexWriter);
                await expectAsync(fileLineReader.buildLineIndex()).toBeResolved();
                expect(lineIndexWriter.pushBack).toHaveBeenCalledTimes(2);
                expect(lineIndexWriter.pushBack.calls.argsFor(0)).toEqual([0]);
                expect(lineIndexWriter.pushBack.calls.argsFor(1)).toEqual([7]);
            });
        });

        describe('and when there are empty lines', () => {
            const contentWithNewLineAtTheEnd = 'hello\r\n\r\n\r\nbonjour';

            it('should skip empty lines sequence', async () => {
                filePartReader.readFilePartByPart.and.callFake(async function* (): AsyncGenerator<Buffer> {
                    yield Buffer.from(contentWithNewLineAtTheEnd);
                });
                const fileLineReader = new LineIndexBuilder(filePartReader, lineIndexWriter);
                await expectAsync(fileLineReader.buildLineIndex()).toBeResolved();
                expect(lineIndexWriter.pushBack).toHaveBeenCalledTimes(4);
                expect(lineIndexWriter.pushBack.calls.argsFor(0)).toEqual([0]);
                expect(lineIndexWriter.pushBack.calls.argsFor(1)).toEqual([7]);
                expect(lineIndexWriter.pushBack.calls.argsFor(2)).toEqual([9]);
                expect(lineIndexWriter.pushBack.calls.argsFor(3)).toEqual([11]);
            });
        });
    });
});
