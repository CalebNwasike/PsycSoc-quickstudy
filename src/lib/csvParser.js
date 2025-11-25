import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export function loadMCATData() {
    const filePath = path.join(process.cwd(), 'data', 'mcat_psych_socio_tagged.csv');
    
    const fileContents = fs.readFileSync(filePath, 'utf8');

    const records = parse(fileContents, {
        columns: ['term', 'definition', 'tag1', 'tag2'],
        skip_empty_lines: true,
        trim: true,
        skip_records_with_empty: false, // Keep records even if tag2 is empty
    });

    return records;
}