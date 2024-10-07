import fs from 'fs';
import { stat } from 'fs/promises';

export interface FilePartReader {
    readFilePart(byteFrom: number, byteTo: number): Promise<Buffer>;
    readFilePartByPart(): AsyncGenerator<Buffer>;
}

const MEGABYTE = 1000;

export class FileStreamPartReader implements FilePartReader {
    private static readonly partSize = 10 * MEGABYTE;
    private readonly pathToFile: string;

    public constructor(pathToFile: string) {
        this.pathToFile = pathToFile;
    }

    public readFilePart(fromIndex: number, toIndex: number): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            let filePartContent: Buffer = Buffer.from('');
            const stream = fs.createReadStream(this.pathToFile, {
                highWaterMark: FileStreamPartReader.partSize,
                flags: 'r',
                autoClose: true,
                start: fromIndex,
                end: toIndex
            });
            stream.on('error', (error) => {
                reject(error.message);
            });
            stream.on('data', (chunk: Buffer) => {
                filePartContent = Buffer.concat([filePartContent, chunk]);
            });
            stream.on('end', () => {
                resolve(filePartContent);
            });
        });
    }

    public async* readFilePartByPart(): AsyncGenerator<Buffer> {
        const fileStats = await stat(this.pathToFile);
        for (let p = 0; p < fileStats.size; p += FileStreamPartReader.partSize) {
            const filePart: Buffer = await this.readFilePart(p, p + FileStreamPartReader.partSize - 1);
            yield filePart;
        }
    }
}
