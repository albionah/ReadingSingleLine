import { FilePartReader } from './FileStreamPartReader';
import { carriageReturnCode, lineFeedCode } from './CharacterCodes';
import { LineIndexReader } from './Index/LineIndexReader';

export class LineGetter {
    private static readonly maxLineLength = 1000;
    private readonly filePartReader: FilePartReader;
    private readonly lineIndex: LineIndexReader;

    public constructor(filePartReader: FilePartReader, lineIndex: LineIndexReader) {
        this.lineIndex = lineIndex;
        this.filePartReader = filePartReader;
    }

    public async getLine(pathToFile: string, lineIndexNumber: number): Promise<string> {
        const lineLocation = await this.lineIndex.getLineLocation(lineIndexNumber);
        if (lineLocation.nextLineStartByte === undefined) {
            return this.getLastLine(lineLocation.startByte);
        } else {
            return this.getSpecificLine(lineLocation.startByte, lineLocation.nextLineStartByte);
        }
    }

    private async getLastLine(startByte: number): Promise<string> {
        return this.getSpecificLine(startByte, LineGetter.maxLineLength);
    }

    private async getSpecificLine(startByte: number, nextLineStartByte: number): Promise<string> {
        const line = await this.filePartReader.readFilePart(startByte, nextLineStartByte - 1);
        const bufferWithoutNewLineCharacters = this.removeTrailingNewLineCharacters(line);
        return bufferWithoutNewLineCharacters.toString();
    }

    /**
     * Supports all platforms
     */
    private removeTrailingNewLineCharacters(buffer: Buffer) {
        const lastIndex = buffer.length - 1;
        if (buffer.length >= 2 && buffer[lastIndex - 1] === carriageReturnCode && buffer[lastIndex] === lineFeedCode) {
            return buffer.subarray(0, -2);
        } else if (buffer.length >= 1 && buffer[lastIndex] === carriageReturnCode || buffer[lastIndex] === lineFeedCode) {
            return buffer.subarray(0, -1);
        }
        return buffer;
    }
}
