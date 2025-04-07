import path from 'path';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';

export default async () => {
	const filename = 'Checking1.csv';
	const filepath = path.resolve(process.cwd(), 'scripts', filename);

	const file = await fs.readFile(filepath, 'utf-8');

	const records = z
		.array(
			z.object({
				Date: z.string(),
				Description: z.string(),
				Amount: z.string()
			})
		)
		.parse(
			parse(file, {
				columns: true,
				skip_empty_lines: true,
				trim: true
			})
		)
		.map((r) => ({
			date: new Date(r.Date),
			description: r.Description,
			amount: parseFloat(r.Amount)
		}));
	console.log(records);
};
