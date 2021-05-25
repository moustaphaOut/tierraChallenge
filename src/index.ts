import { getTestData } from "./testData";
import moment from 'moment-timezone';

require('source-map-support').install();

export interface Locale {
    openingTimes: OpeningTime[]
    pauseActions: PauseAction[]
    timezone: string
}

export interface OpeningTime {
    start: string,
    end: string
}

export interface PauseAction {
    action: 'pause' | 'unpause',
    datetime: string
}


export function getTimePaused(locale: Locale, start: string, end: string): number {
    let totalPaused = -1;
    return totalPaused;
}

/* const testData = getTestData();
for (const td of testData) {
    getTimePaused(td[0], td[1], td[2]);
} */