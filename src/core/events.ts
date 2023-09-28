export function createDelegatedEventDispatcher() {
    const callbacks = {};

    return {
        onDelegatedEvent(type, attr, callback) {
            if (!callbacks[type])
                callbacks[type] = {};
            callbacks[type][attr] = callback;
        },

        offDelegatedEvent(type, attr) {
            delete callbacks[type][attr];
        },

        onEvent(e) {
            let { type, target } = e;
            const cbs = callbacks[type];
            if (!cbs) return;

            let match;
            let element = target;
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
    }
}

function matches(cbs, element) {
    let data;
    for (let attr in cbs) {
        if (data = element.getAttribute(attr)) {
            return { attr, data };
        }
    }
}
