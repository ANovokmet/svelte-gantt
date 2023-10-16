import moment from 'moment';

window.moment = moment;

export function time(input) {
    return moment(input, 'HH:mm');
}
