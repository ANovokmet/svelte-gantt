import moment from 'moment';

export function time(input) {
    return moment(input, 'HH:mm');
}
