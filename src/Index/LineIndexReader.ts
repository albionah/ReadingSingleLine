import { LineLocation } from './LineLocation';

export interface LineIndexReader {
    getLineLocation(lineIndexNumber: number): Promise<LineLocation>;
}
