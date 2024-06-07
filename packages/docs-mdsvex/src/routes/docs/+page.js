import { redirect } from '@sveltejs/kit';

export const load = () => {
	redirect(307, '/docs/getting-started/installation');
};
