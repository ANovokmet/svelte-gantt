import { derived, writable } from "svelte/store";
import { page } from '$app/stores';

export const isSidebarOpen = writable(false);

export let pages = [
    {
        title: "Getting started",
        pages: [
            { href: "/docs/getting-started/installation", label: "Installation" },
            { href: "/docs/getting-started/migrating", label: "Migrating" },
        ]
    },
    {
        title: "Data",
        pages: [
            { href: "/docs/data/rows", label: "Rows" },
            { href: "/docs/data/tasks", label: "Tasks" },
            { href: "/docs/data/time-ranges", label: "Time ranges" },
        ]
    },
    {
        title: 'Options',
        pages: [
            { href: "/docs/options/gantt", label: "Gantt" },
            { href: "/docs/options/columns", label: "Columns" },
            { href: "/docs/options/headers", label: "Headers" },
            { href: "/docs/options/zoom", label: "Zoom" },
            { href: "/docs/options/layout", label: "Layout" },
        ]
    },
    {
        title: 'Modules',
        pages: [
            { href: "/docs/modules/dependencies", label: "Dependencies" },
            { href: "/docs/modules/table", label: "Table" },
            { href: "/docs/modules/external", label: "External" },
            { href: "/docs/modules/create-tasks", label: "Create tasks" },
        ]
    }
];

export const meta = derived([page], ([currentPage]) => {
    for(const category of pages) {
        for (const page of category.pages) {
            if (currentPage.url.pathname.includes(page.href)) {
                return {
                    category,
                    page,
                };
            }
        }
    }
    return {};
}); 

const normalized = pages.flatMap(category => category.pages);

export const previousPage = derived([meta], ([meta]) => {
    if (!meta.page) {
        return null;
    }
    const index = normalized.findIndex(item => item.href == meta.page.href);
    return normalized[index - 1];
});

export const nextPage = derived([meta], ([meta]) => {
    if (!meta.page) {
        return null;
    }
    const index = normalized.findIndex(item => item.href == meta.page.href);
    return normalized[index + 1];
});