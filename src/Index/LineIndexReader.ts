import { LineLocation } from './LineLocation';

export interface LineIndexReader {
    getLineLocation(lineNumber: number): Promise<LineLocation>;
}
