import { describe, it, expect } from 'vitest';
import { runTs, runTask } from '$lib/server/utils/task';

describe('Run a typescript file', () => {
	it('Will run /src/tests/task-import.ts', async () => {
		const res = (await runTs('/src/tests/task-import', 'test', 'hello')).unwrap();
		expect(res).toBe('hello');
	});
});

describe('Run a command', () => {
	it('Will run git status', async () => {
		const res = (await runTask('git', 'status')).unwrap();
		expect(res).toBe(undefined);
	});
});
