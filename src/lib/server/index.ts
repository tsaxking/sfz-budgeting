import { Struct } from 'drizzle-struct/back-end';

const postBuild = async () => {};

{
	const built = new Set<string>();
	for (const struct of Struct.structs.values()) {
		struct.once('build', () => {
			built.add(struct.name);
			if (built.size === Struct.structs.size) {
				postBuild();
			}
		});
	}
}
