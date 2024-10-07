export interface LineIndexWriter {
    pushBack(lineStartByte: number): Promise<void>;
}
