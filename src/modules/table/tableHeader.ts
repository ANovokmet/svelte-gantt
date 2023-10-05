import type { SvelteRow } from '../../core/row';

export interface TableHeader {
    /** Table column title */
    title: string;
    /** Table row property */
    property: string;
    width?: number;
    /** Result can be a html string */
    renderer?: (row: SvelteRow) => string;
    /** Type of header, can be `tree` */
    type?: 'tree' | any;
}
