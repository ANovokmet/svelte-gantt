export default class {
    constructor(gantt){
        this.gantt = gantt;
        this.listeners = [];
        this.listenersMap = {};
    }

    registerEvent(featureName, eventName) {
        if (!this[featureName]) {
            this[featureName] = {}      
        }
    
        let feature = this[featureName]
        if (!feature.on) {
            feature.on = {}
            feature.raise = {}
        }
    
        let eventId = 'on:' + featureName + ':' + eventName
    
        feature.raise[eventName] = (...params) => {
            //todo add svelte? event listeners, looping isnt effective unless rarely used
            this.listeners.forEach(listener => {
                if(listener.eventId === eventId){
                    listener.handler(params);
                }
            });
        }
    
        // Creating on event method featureName.oneventName
        feature.on[eventName] = (handler) => {
    
            // track our listener so we can turn off and on
            let listener = {
                handler: handler,
                eventId: eventId
            }
            this.listenersMap[eventId] = listener;
            this.listeners.push(listener)
    
            let removeListener = () => {
                let index = this.listeners.indexOf(listener)
                this.listeners.splice(index, 1)
            }
    
            return removeListener
        }
      }
}