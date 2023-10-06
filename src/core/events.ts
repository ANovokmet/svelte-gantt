type DelegatedCallback = (e: MouseEvent, data: string, target: Element) => void;

export function createDelegatedEventDispatcher() {
    const callbacks: { [type: string]: { [attr: string]: DelegatedCallback } } = {};

    return {
        onDelegatedEvent(type, attr, callback: DelegatedCallback) {
            if (!callbacks[type]) callbacks[type] = {};
            callbacks[type][attr] = callback;
        },

        offDelegatedEvent(type, attr) {
            delete callbacks[type][attr];
        },

        onEvent(e: MouseEvent) {
            const { type, target } = e;
            const cbs = callbacks[type];
            if (!cbs) return;

            let match;
            let element = target as Element;
            while (element && element != e.currentTarget) {
                if ((match = matches(cbs, element))) {
                    break;
                }
                element = element.parentElement;
            }
            if (match && cbs[match.attr]) {
                cbs[match.attr](e, match.data, element);
            } else if (cbs['empty']) {
                cbs['empty'](e, null, element);
            }
        }
    };
}

function matches(cbs, element) {
    let data;
    for (const attr in cbs) {
        if ((data = element.getAttribute(attr))) {
            return { attr, data };
        }
    }
}
