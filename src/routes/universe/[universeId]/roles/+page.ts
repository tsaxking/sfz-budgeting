import { Universes } from '$lib/model/universe.js';

export const load = (event) => {
	const universe = event.data.universe;
	return {
		universe: Universes.Universe.Generator(universe)
	};
};
