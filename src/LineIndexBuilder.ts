import { FilePartReader } from './FileStreamPartReader';
import { carriageReturnCode, lineFeedCode } from './CharacterCodes';
import { LineIndexWriter } from './Index/LineIndexWriter';

export class LineIndexBuilder {
    private readonly filePartReader: FilePartReader;
    private readonly lineIndex: LineIndexWriter;

    public constructor(filePartReader: FilePartReader, lineIndex: LineIndexWriter) {
        this.filePartReader = filePartReader;
        this.lineIndex = lineIndex;
    }

    public async buildLineIndex(): Promise<void> {
        let bytePointer = 0;
        for await (const line of this.readLines()) {
            await this.lineIndex.pushBack(bytePointer);
            bytePointer += line.length + 1;
        }
    }

    private async* readLines(): AsyncGenerator<Buffer> {
        let buffer: Buffer = Buffer.from('');
        for await (const filePart of this.filePartReader.readFilePartByPart()) {
            buffer = this.joinLineInProgressWithNewPart(buffer, filePart);
            for (let j = 0; j < buffer.length; ) {
                if (this.isNewLine(buffer, j)) {
                    if (this.isTwoByteWindowsNewLineSequence(buffer, j)) {
                        j++;
                    }
                    yield buffer.subarray(0, j);
                    buffer = buffer.subarray(j + 1);
                    j = 0;
                } else {
                    j++;
                }
            }
        }
    }

    private joinLineInProgressWithNewPart(buffer: Buffer, filePart: Buffer) {
        return Buffer.concat([buffer, filePart]);
    }

    private isNewLine(buffer: Buffer, j: number): boolean {
        return buffer[j] === lineFeedCode || buffer[j] === carriageReturnCode;
    }

    private isTwoByteWindowsNewLineSequence(buffer: Buffer, j: number): boolean {
        return buffer[j] === carriageReturnCode && buffer[j + 1] === lineFeedCode;
    }
}
