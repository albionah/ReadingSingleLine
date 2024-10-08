export interface FilePartReader {
    readFilePart(byteFrom: number, byteTo?: number): Promise<Buffer>;
    readFilePartByPart(): AsyncGenerator<Buffer>;
}
