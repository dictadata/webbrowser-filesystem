"use strict";

/**
 * Parse an ISO date string and return a JavaScript Date object.
 * See examples in _test() function below.
 */
let toDate = exports.toDate = function (isoString) {
  if (isoString.length === 10)
    isoString += "T00:00:00";

  // Split the string into an array based on the digit groups.
  var dateParts = isoString.split(/\D+/);
  if (dateParts.length < 3)
    return isoString;

  var jsDate = new Date();

  // Note: Using the UTC versions of these functions which adjusts values to local timezone
  jsDate.setUTCFullYear(parseInt(dateParts[0]));
  jsDate.setUTCMonth(parseInt(dateParts[1] - 1)); // The month numbers start at 0
  jsDate.setUTCDate(parseInt(dateParts[2]));

  jsDate.setUTCHours(0, 0, 0, 0);
  if (!dateParts[3]) {
    // date only
    return jsDate;
  }

  // Set the time parts of the date object.
  jsDate.setUTCHours(parseInt(dateParts[3]));
  if (dateParts[4])
    jsDate.setUTCMinutes(parseInt(dateParts[4]));
  if (dateParts[5])
    jsDate.setUTCSeconds(parseInt(dateParts[5]));

  // get some info about the fraction and offset, they are optional
  var hasFraction = isoString.lastIndexOf('.') > 12;
  let z = isoString.lastIndexOf('Z') > 12;
  let plus = isoString.lastIndexOf('+') > 12;
  let minus = isoString.lastIndexOf('-') > 12;
  var isUTC = z || plus || minus;

  let tzh = 6;  // index for date and time offsets
  let tzm = 7;
  if (hasFraction) {
    let ms = (dateParts[6]) ? dateParts[6] : 0;
    jsDate.setUTCMilliseconds(parseInt(ms));
    tzh = 7;
    tzm = 8;
  }

  // timezone adjustments
  let minutes = 0;
  if (dateParts[tzh])
    minutes += parseInt(dateParts[tzh]) * 60;
  if (dateParts[tzm])
    minutes += parseInt(dateParts[tzm]);
  if (minutes && plus)
    minutes *= -1;

  if (!isUTC)
    // adjust to local time zone because we used setUTC functions above
    minutes = jsDate.getTimezoneOffset();

  // adjusted for timezone offset
  jsDate.setUTCMinutes(jsDate.getMinutes() + minutes);

  return jsDate;
};
