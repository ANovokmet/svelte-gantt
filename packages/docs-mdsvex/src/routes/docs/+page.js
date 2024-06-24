import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';

export const load = () => {
	redirect(307, `${base}/docs/getting-started/installation`);
};
