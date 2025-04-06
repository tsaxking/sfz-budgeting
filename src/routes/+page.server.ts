import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
    if (!event.locals.account) {
        throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
    } else {
        throw redirect(ServerCode.permanentRedirect, '/dashboard');
    }
};