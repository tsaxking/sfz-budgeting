import { BACKUP_DIR } from './backup';
import fs from 'fs';
import path from 'path';
import { select } from '../src/lib/server/cli/utils';
import { runTask } from '../src/lib/server/utils/task';
import { Client } from 'pg';
import { z } from 'zod';
import { openStructs } from '../src/lib/server/cli/struct';
import { DB } from '../src/lib/server/db';
import { Struct } from 'drizzle-struct/back-end';
import AdmZip from 'adm-zip';
import backup from './backup';
import { resolveAll } from 'ts-utils/check';

export default async (file?: string) => {
	await backup();
	(await openStructs()).unwrap();

	if (!file) {
		const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.zip'));
		const res = await select({
			message: 'Select a file to restore',
			options: files.map((f) => ({
				name: f,
				value: f
			}))
		});
		if (res.isErr()) {
			console.error(res.error);
			process.exit(1);
		}
		file = res.value;
	}

	if (!file) {
		console.error('No file provided');
		process.exit(1);
	}

	const zip = new AdmZip(path.join(BACKUP_DIR, file));

	zip.extractAllTo(path.join(BACKUP_DIR, file.replace('.zip', '')), true);

	const files = fs.readdirSync(path.join(BACKUP_DIR, file.replace('.zip', '')));

	await Promise.all(
		files.map((f) => {
			const struct = Struct.structs.get(f.split('-')[0] || '');

			if (!struct) {
				return;
			}

			return struct.restore(path.join(BACKUP_DIR, file.replace('.zip', ''), f));
		})
	);

	await fs.promises.rm(path.join(BACKUP_DIR, file.replace('.zip', '')), { recursive: true });
};
