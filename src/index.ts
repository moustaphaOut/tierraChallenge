import { getTestData } from "./testData";
import moment from "moment-timezone";

require("source-map-support").install();

/**
 * These interfaces are explained in greater detail in the readme. They correspond to the locale and the relevant data for the challenge.
 */

export interface Locale {
  openingTimes: OpeningTime[];
  pauseActions: PauseAction[];
  timezone: string;
}

export interface OpeningTime {
  start: string;
  end: string;
}

export interface PauseAction {
  action: "pause" | "unpause";
  datetime: string;
}

enum EventType {
  Pause = "pause",
  UnPause = "unpause",
}
type TimeEvent = {
  date: moment.Moment;
  type: EventType;
};

/**
 * The purpose of the function is to return a list of pauseActions
 */
const getPauseActionEvents = (locale: Locale) =>
  locale.pauseActions.map<TimeEvent>((pauseAction) => ({
    date: moment(pauseAction.datetime).tz(locale.timezone),
    type: pauseAction.action as EventType,
  }));

const diffTime = (
  currentDate: any, //currentDate = pause
  dayOpeningTimes: any,
  startDateCompare: any, //startDateCompare = unpause
  compareCase: number
) => {
  const [openingHour, openingMinute] = dayOpeningTimes.start
    .split(":")
    .map((x: string) => parseInt(x));
  const [closingHour, closingMinute] = dayOpeningTimes.end
    .split(":")
    .map((x: string) => parseInt(x));

  const isOvernightShift = closingHour <= openingHour;

  var closeDay = moment(startDateCompare);
  var openDay = moment(startDateCompare);
  closeDay.set({ h: closingHour, m: closingMinute, s: 0, millisecond: 0 });
  openDay.set({ h: openingHour, m: openingMinute, s: 0, millisecond: 0 });

  if (compareCase == 0) {
    //compare only with start pause
    if (
      startDateCompare.diff(openDay) > 0 &&
      closeDay.diff(startDateCompare) > 0
    )
      return closeDay.diff(startDateCompare);
    else return 0;
  } else if (compareCase == 2) {
    //compare with both
    if (isOvernightShift) {
      if (currentDate.diff(openDay) > 0)
        if (
          startDateCompare.diff(openDay) > 0 &&
          currentDate.diff(startDateCompare) > 0
        )
          return currentDate.diff(startDateCompare);
        else return currentDate.diff(openDay);
      else return 0;
    } else {
      if (currentDate.diff(openDay) > 0 && closeDay.diff(currentDate) > 0)
        if (
          startDateCompare.diff(openDay) > 0 &&
          currentDate.diff(startDateCompare) > 0
        )
          return currentDate.diff(startDateCompare);
        else return currentDate.diff(openDay);
      else return 0;
    }
  } else if (compareCase == 1) {
    //compare only with end pause
    if (currentDate.diff(openDay) > 0 && openDay.diff(currentDate) > 0)
      return currentDate.diff(openDay);
    else return 0;
  }
};

/**
 * The purpose of the function is to compare two dates without taking time into considiration.
 * it return 1 if date1 is greater than date2
 * it return -1 if date1 is less than date2
 * it return 0 if they are equal
 *
 */
const diffDate = (date1: moment.Moment, date2: moment.Moment) => {
  let time1 = moment("2023-09-07T00:00:00.00");
  time1.set({
    y: date1.year(),
    month: date1.month(),
    date: date1.date(),
  });
  let time2 = moment("2023-09-07T00:00:00.00");
  time2.set({
    y: date2.year(),
    month: date2.month(),
    date: date2.date(),
  });

  if (time2.diff(time1) > 0) return -1;
  else if (time2.diff(time1) < 0) return 1;
  else return 0;
};

const holidays = (dayOpeningTimes: any) => {
  const [openingHour, openingMinute] = dayOpeningTimes.start
    .split(":")
    .map((x: string) => parseInt(x));
  const [closingHour, closingMinute] = dayOpeningTimes.end
    .split(":")
    .map((x: string) => parseInt(x));
  return (
    (closingHour - openingHour) * 3600 + (closingMinute - openingMinute) * 60
  );
};

/**
 * The purpose of the function is to take this locale, and ascertain how much time it was paused between the start date and end date
 */

export function getTimePaused(
  locale: Locale,
  start: string,
  end: string
): number {
  const startDate = moment(start).tz(locale.timezone);
  const endDate = moment(end).tz(locale.timezone);
  const pauseActionsEvents = getPauseActionEvents(locale);
  let totalPaused = 0;

  if (locale.pauseActions.length == 0) return 0;
  else if (
    diffDate(startDate, moment(locale.pauseActions[0].datetime)) > 0 ||
    diffDate(moment(locale.pauseActions[0].datetime), endDate) > 0
  )
    return 0;
  else if (locale.pauseActions.length > 0)
    for (let index = 0; index < locale.pauseActions.length; index++) {
      const currentDate = moment(locale.pauseActions[index].datetime);
      if (startDate.diff(currentDate) > 0) continue;
      if (currentDate.diff(endDate) > 0) {
        const currentDate1 = moment(locale.pauseActions[index - 1].datetime);
        const dayOfWeek = endDate.day() - 1;

        totalPaused += diffTime(
          endDate,
          locale.openingTimes[dayOfWeek],
          currentDate1,
          2
        );
        break;
      }

      if (locale.pauseActions[index].action == EventType.UnPause) {
        let startDateCompare;
        if (index - 1 < 0) startDateCompare = startDate;
        else startDateCompare = pauseActionsEvents[index - 1].date;

        const pausedDays =
          pauseActionsEvents[index].date.day() - startDateCompare.day() + 1;

        for (let i = 0; i < pausedDays; i++) {
          let dayOfWeek = startDateCompare.add(i, "days").day() - 1;

          if (pausedDays == 1) {
            dayOfWeek = pauseActionsEvents[index].date.day() - 1;

            totalPaused += diffTime(
              pauseActionsEvents[index].date,
              locale.openingTimes[dayOfWeek],
              startDateCompare,
              2 // compare with both !
            );
          } else if (i != 0 && i != pausedDays - 1)
            totalPaused += holidays(locale.openingTimes[dayOfWeek]);
          // don't compare !
          else if (i == pausedDays - 1 && pausedDays != 1) {
            dayOfWeek = startDateCompare.day() - 1;

            totalPaused += diffTime(
              pauseActionsEvents[index].date,
              locale.openingTimes[dayOfWeek],
              startDateCompare,
              1 // compare only with end pause !
            );
          } else if (i == 0 && pausedDays != 1) {
            totalPaused += diffTime(
              pauseActionsEvents[index].date.subtract(
                pausedDays - i - 1,
                "days"
              ),
              locale.openingTimes[dayOfWeek],
              startDateCompare,
              0 // compare only with start pause !
            );
          }
        }
      }
    }
  return totalPaused;
}

/**
 * Use the code below to run the function on the test data. See the readme for how to run this code
 */

const testData = getTestData();
for (let i = 0; i < testData.length; i++) {
  const td = testData[i];
  getTimePaused(td[0], td[1], td[2]);
}
