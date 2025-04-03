import { Universes } from '$lib/model/universe.js';

export const load = (event) => {
	return {
		universes: event.data.universes.map((u) => Universes.Universe.Generator(u)),
		invites: event.data.invites.map((i) => ({
			invite: Universes.UniverseInvites.Generator(i.invite),
			universe: Universes.Universe.Generator(i.universe)
		})),
		publicUniverses: event.data.publicUniverses.map((u) => Universes.Universe.Generator(u)),
		universePage: event.data.universePage,
		invitePage: event.data.invitePage,
		universeNumber: event.data.universeNumber,
		inviteNumber: event.data.inviteNumber,
		universeCount: event.data.universeCount,
		inviteCount: event.data.inviteCount
	};
};
