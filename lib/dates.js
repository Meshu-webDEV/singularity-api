const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const relativeTime = require("dayjs/plugin/relativeTime");
const { errorMessages } = require("./constants");
// import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(relativeTime);

/**
 *
 * @param {dayjs} date
 */
function getDate(date) {
  return dayjs(date).format();
}

/**
 *
 * @param {dayjs} date
 */
function getUtc(date) {
  return new Date(dayjs(date).utc().format()).toISOString();
}

/**
 *
 * @param {dayjs} date
 */
function getUtcISO8601(date) {
  return dayjs(date).toISOString();
}

/**
 *
 * @param {dayjs} date - dayjs type date
 * @param {string} period - A string representing the period you want the start of *
 *  @example
 *     getUtcStartOf(date, 'day')
 *     getUtcStartOf(date, 'year')
 */
function getUtcStartOf(date, period) {
  return new Date(dayjs(date).utc().startOf(period).format()).toISOString();
}

/**
 * A function that takes your local time,
 * turns it to the desired start of "period"
 * Then returns the local start of "period" date in UTC
 *
 * @param {dayjs} date - dayjs type date - Local time
 * @param {string} period - A string representing the period you want the start of
 *  @example
 *     startOfLocalToUtc(date, 'day')
 *     startOfLocalToUtc(date, 'year')
 *     Local time: 2021-05-25T01:08:51+00:00
 *     Start of day in local: 2021-05-25T00:00:00.000Z
 *     Local start of day in UTC: 2021-05-24T21:00:00.000Z
 */
function startOfLocalToUtc(date, period) {
  return new Date(
    dayjs(
      dayjs(dayjs(dayjs(date)).format())
        .startOf(period)
        .format()
    )
      .utc()
      .format()
  ).toISOString();
}

/**
 * A function that takes your local time,
 * turns it to the desired start of "period"
 * Then returns the local end of "period" in UTC
 *
 * @param {dayjs} date - dayjs type date - Local time
 * @param {string} period - A string representing the period you want the end of
 *  @example
 *     endOfLocalToUtc(date, 'day')
 *     endOfLocalToUtc(date, 'year')
 *     Local time: 2021-05-25T01:08:51+00:00
 *     End of day in local: 2021-05-25T23:59:59.000Z
 *     Local end of day in UTC: 2021-05-24T21:00:00.000Z
 */
function endOfLocalToUtc(date, period) {
  return new Date(
    dayjs(
      dayjs(dayjs(dayjs(date)).format())
        .endOf(period)
        .format()
    )
      .utc()
      .format()
  ).toISOString();
}

/**
 *
 * @param {Date} date
 */
function Add24Hours(date) {
  console.log(
    dayjs(dayjs(new Date(date)).add(24, "hours"))
      .utc()
      .format("YYYY/MM/DD")
  );
  return dayjs(dayjs(new Date(date)).subtract(24, "hours")).utc();
}

/**
 *
 * @param {Date} date
 */
function isHoursAgo(date, hours) {
  return dayjs(new Date(date)).add(hours, "hours").isBefore(dayjs(new Date()));
}

/**
 *
 * @param {number} hours
 */
function addHoursFromNow(hours) {
  return new Date(dayjs(new Date()).add(hours, "hours").format());
}
/**
 *
 * @param {number} day
 */
function addDaysFromNow(day) {
  return new Date(dayjs(new Date()).add(day, "day").format());
}

/**
 *
 * @param {number} hours
 */
function subtractHoursFromNow(hours) {
  return dayjs(new Date()).utc().subtract(hours, "hours");
}
/**
 *
 * @param {number} days
 */
function subtractDaysFromNow(days) {
  return new Date(dayjs(new Date()).utc().subtract(days, "day").format());
}

function isPast() {
  return dayjs(date).isBefore(new Date());
}

function fromDate(date) {
  try {
    return dayjs(date).fromNow();
  } catch (error) {
    console.log("error formatting date", error.message);
    return new Error(errorMessages.INTERNAL);
  }
}

module.exports = {
  fromDate,
  isPast,
  getDate,
  getUtc,
  getUtcISO8601,
  getUtcStartOf,
  startOfLocalToUtc,
  endOfLocalToUtc,
  subtractHoursFromNow,
  subtractDaysFromNow,
  Add24Hours,
  isHoursAgo,
  addHoursFromNow,
  addDaysFromNow,
};
