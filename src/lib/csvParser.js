import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export function loadMCATData() {
    const filePath = path.join(process.cwd(), 'data', 'mcat_psych_socio_with_subsections.csv');
    
    const fileContents = fs.readFileSync(filePath, 'utf8');

    const records = parse(fileContents, {
        columns: true, // Use header row to map columns
        skip_empty_lines: true,
        trim: true,
        skip_records_with_empty: false, // Keep records even if tag2 or subsection is empty
    });

    return records;
}