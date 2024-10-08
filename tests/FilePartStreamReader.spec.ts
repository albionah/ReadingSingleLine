import fsMock from 'mock-fs';
import { FilePartStreamReader } from '../src/FilePartStreamReader';

describe('FilePartStreamReader', () => {
    const fileName = 'file.txt';
    const content = 'hello\r\nbonjour\r\nhola\r\nsalve';

    beforeEach(() => {
        fsMock({
            [fileName]: content
        });
    });

    describe('when readFilePart is called', () => {
        describe('and when it is called with range 0-4 (including)', () => {
            it('should read only the first line', async () => {
                const filePartReader = new FilePartStreamReader(fileName);
                const buffer = Buffer.from(content.substring(0, 5));
                await expectAsync(filePartReader.readFilePart(0, 4)).toBeResolvedTo(buffer);
            });
        });

        describe('and when it is called with range 5-15 (including)', () => {
            it('should read only selected part of the file', async () => {
                const filePartReader = new FilePartStreamReader(fileName);
                const buffer = Buffer.from(content.substring(5, 16));
                await expectAsync(filePartReader.readFilePart(5, 15)).toBeResolvedTo(buffer);
            });
        });

        describe('when file does not exist', () => {
            it('should be rejected', async () => {
                const filePartReader = new FilePartStreamReader('not existing file');
                await expectAsync(filePartReader.readFilePart(0, 10)).toBeRejected();
            });
        });

        describe('when "byte from" is a negative number', () => {
            it('should be rejected', async () => {
                const filePartReader = new FilePartStreamReader(fileName);
                await expectAsync(filePartReader.readFilePart(-10, Number.MAX_SAFE_INTEGER)).toBeRejectedWithError();
            });
        });

        describe('when "byte from" is greater than "byte to"', () => {
            it('should be rejected', async () => {
                const filePartReader = new FilePartStreamReader(fileName);
                await expectAsync(filePartReader.readFilePart(10, 2)).toBeRejectedWithError();
            });
        });

        describe('when "byte to" is not passed', () => {
            it('should read the last line of the file', async () => {
                const filePartReader = new FilePartStreamReader(fileName);
                const buffer = Buffer.from(content.substring(22));
                await expectAsync(filePartReader.readFilePart(22)).toBeResolvedTo(buffer);
            });
        });

        describe('when "byte to" is much much greater than size of the file', () => {
            it('should change the value to size of the file and only read the file to its end', async () => {
                const filePartReader = new FilePartStreamReader(fileName);
                const buffer = Buffer.from(content);
                await expectAsync(filePartReader.readFilePart(0, Number.MAX_SAFE_INTEGER)).toBeResolvedTo(buffer);
            });
        });
    });

    describe('when readFilePartByPart is called', () => {
        it('should iterate through chunks of file and give the whole content of the file in the end', async () => {
            const filePartReader = new FilePartStreamReader(fileName);
            let buffer = Buffer.from([]);
            for await (const filePart of filePartReader.readFilePartByPart()) {
                buffer = Buffer.concat([buffer, filePart]);
            }
            expect(buffer.toString()).toBe(content);
        });
    });
});
