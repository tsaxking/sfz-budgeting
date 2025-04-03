import { Universes } from '$lib/server/structs/universe.js';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	const { universeId } = event.params;

	const universe = await Universes.Universe.fromId(universeId);
	if (universe.isErr()) {
		console.error(universe.error);
		throw fail(ServerCode.internalServerError);
	}

	if (!universe.value) {
		throw redirect(ServerCode.permanentRedirect, `/status/404?url=${event.request.url}`);
	}

	return {
		universe: universe.value.safe()
	};
};

export const actions = {
	async invite(event) {
		const body = await event.request.formData();
		const user = body.get('user');
	},
	async 'account-list'(event) {}
};
