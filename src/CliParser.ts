import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface Parameters {
    pathToFile: string;
    lineIndexNumber: number;
}

export class CliParser {
    public static parse(argv: string[]): Parameters {
        const parsedCli = yargs(hideBin(argv))
            .command('$0 <file> <line>', '')
            .usage('Usage: ts-node src/main.ts <file> <line> \n\n Prints a single line from a huge file')
            .positional('file', {
                describe: 'Path to the text file',
                type: 'string',
                demandOption: true
            })
            .positional('line', {
                describe: 'An index of line from the file to be printed',
                type: 'number',
                demandOption: true
            })
            .check((argv) => {
                if (typeof argv.line !== 'number' || isNaN(argv.line) || argv.line < 0) {
                    throw new Error('Line index must be a positive number or zero');
                }
                return true;
            })
            .parseSync();

        return { pathToFile: parsedCli.file as string, lineIndexNumber: parsedCli.line as number };
    }
}
