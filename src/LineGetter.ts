import { carriageReturnCode, lineFeedCode } from './CharacterCodes';
import { LineIndexReader } from './Index/LineIndexReader';
import { LineLocation } from './Index/LineLocation';
import { FilePartReader } from './FilePartReader';

export class LineGetter {
    private readonly filePartReader: FilePartReader;
    private readonly lineIndex: LineIndexReader;

    public constructor(filePartReader: FilePartReader, lineIndex: LineIndexReader) {
        this.lineIndex = lineIndex;
        this.filePartReader = filePartReader;
    }

    public async getLine(lineIndexNumber: number): Promise<string> {
        const lineLocation: LineLocation = await this.lineIndex.getLineLocation(lineIndexNumber);
        if (lineLocation.nextLineStartByte === undefined) {
            return this.getLastLine(lineLocation.startByte);
        } else {
            return this.getSpecificLine(lineLocation.startByte, lineLocation.nextLineStartByte);
        }
    }

    private async getLastLine(startByte: number): Promise<string> {
        const line: Buffer = await this.filePartReader.readFilePart(startByte);
        const bufferWithoutNewLineCharacters: Buffer = this.removeTrailingNewLineCharacters(line);
        return bufferWithoutNewLineCharacters.toString();
    }

    private async getSpecificLine(startByte: number, nextLineStartByte: number): Promise<string> {
        const line: Buffer = await this.filePartReader.readFilePart(startByte, nextLineStartByte - 1);
        const bufferWithoutNewLineCharacters: Buffer = this.removeTrailingNewLineCharacters(line);
        return bufferWithoutNewLineCharacters.toString();
    }

    /**
     * Supports all platforms.
     * Removes \r or \n or both together.
     */
    private removeTrailingNewLineCharacters(buffer: Buffer): Buffer {
        const lastIndex = buffer.length - 1;
        if (buffer.length >= 2 && buffer[lastIndex - 1] === carriageReturnCode && buffer[lastIndex] === lineFeedCode) {
            return buffer.subarray(0, -2);
        } else if (buffer.length >= 1 && buffer[lastIndex] === carriageReturnCode || buffer[lastIndex] === lineFeedCode) {
            return buffer.subarray(0, -1);
        }
        return buffer;
    }
}
