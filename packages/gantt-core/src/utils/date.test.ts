import { describe, it, expect } from 'vitest';
import {
  toTimestamp,
  startOf,
  addTime,
  getExactDuration,
  divideTimeRange,
  isHighlighted,
  type HighlightOptions,
} from './date';

describe('Date Utils', () => {
  describe('toTimestamp', () => {
    it('should return the timestamp when given a number', () => {
      const timestamp = 1645564800000; // Feb 23, 2022
      expect(toTimestamp(timestamp)).toBe(timestamp);
    });
    
    it('should convert a Date to a timestamp', () => {
      const date = new Date(2022, 1, 23); // Feb 23, 2022
      const timestamp = date.getTime();
      expect(toTimestamp(date)).toBe(timestamp);
    });
  });

  describe('startOf', () => {
    it('should get the start of year', () => {
      const date = new Date(2022, 5, 15, 13, 45, 30); // June 15, 2022, 13:45:30
      const expectedStart = new Date(2022, 0, 1).getTime(); // Jan 1, 2022, 00:00:00
      expect(startOf(date.getTime(), 'year')).toBe(expectedStart);
      expect(startOf(date.getTime(), 'y')).toBe(expectedStart);
    });
    
    it('should get the start of month', () => {
      const date = new Date(2022, 5, 15, 13, 45, 30); // June 15, 2022, 13:45:30
      const expectedStart = new Date(2022, 5, 1).getTime(); // June 1, 2022, 00:00:00
      expect(startOf(date.getTime(), 'month')).toBe(expectedStart);
    });
    
    it('should get the start of day', () => {
      const date = new Date(2022, 5, 15, 13, 45, 30); // June 15, 2022, 13:45:30
      const expectedStart = new Date(2022, 5, 15).getTime(); // June 15, 2022, 00:00:00
      expect(startOf(date.getTime(), 'day')).toBe(expectedStart);
      expect(startOf(date.getTime(), 'd')).toBe(expectedStart);
    });
    
    it('should get the start of hour', () => {
      const date = new Date(2022, 5, 15, 13, 45, 30); // June 15, 2022, 13:45:30
      const expectedStart = new Date(2022, 5, 15, 13, 0, 0).getTime(); // June 15, 2022, 13:00:00
      expect(startOf(date.getTime(), 'hour')).toBe(expectedStart);
      expect(startOf(date.getTime(), 'h')).toBe(expectedStart);
    });
  });

  describe('addTime', () => {
    it('should add years correctly', () => {
      const date = new Date(2022, 1, 15); // Feb 15, 2022
      const expected = new Date(2024, 1, 15); // Feb 15, 2024
      expect(addTime(date, 'year', 2).getTime()).toBe(expected.getTime());
    });
    
    it('should add months correctly', () => {
      const date = new Date(2022, 1, 15); // Feb 15, 2022
      const expected = new Date(2022, 4, 15); // May 15, 2022
      expect(addTime(date, 'month', 3).getTime()).toBe(expected.getTime());
    });
    
    // YAGNI
    // it('should handle month rollover correctly', () => {
    //   const date = new Date(2022, 0, 31); // Jan 31, 2022
    //   const result = addTime(date, 'month', 1);
    //   // Feb doesn't have 31 days, so it should be the last day of Feb
    //   expect(result.getMonth()).toBe(1); // February
    //   expect(result.getDate()).toBe(28); // Last day of Feb 2022
    // });
  });

  describe('divideTimeRange', () => {
    it('should divide a day into hours', () => {
      const start = new Date(2022, 1, 15).getTime(); // Feb 15, 2022, 00:00:00
      const end = new Date(2022, 1, 15, 4).getTime(); // Feb 15, 2022, 04:00:00
      
      const periods = divideTimeRange(start, end, 'hour', 1);
      
      expect(periods.length).toBe(4);
      expect(periods[0].from).toBe(start);
      expect(periods[0].to).toBe(new Date(2022, 1, 15, 1).getTime());
      expect(periods[3].to).toBe(end);
    });
    
    it('should handle partial periods at the end', () => {
      const start = new Date(2022, 1, 15).getTime(); // Feb 15, 2022, 00:00:00
      const end = new Date(2022, 1, 15, 2, 30).getTime(); // Feb 15, 2022, 02:30:00
      
      const periods = divideTimeRange(start, end, 'hour', 1);
      
      expect(periods.length).toBe(3);
      expect(periods[2].duration).toBe(30 * 60 * 1000); // 30 minutes in ms
    });
    
    it('should respect the offset parameter', () => {
      const start = new Date(2022, 1, 15).getTime(); // Feb 15, 2022
      const end = new Date(2022, 1, 19).getTime(); // Feb 19, 2022
      
      const periods = divideTimeRange(start, end, 'day', 2);
      
      expect(periods.length).toBe(2);
      expect(periods[0].from).toBe(start);
      expect(periods[0].to).toBe(new Date(2022, 1, 17).getTime()); // Feb 17
      expect(periods[1].to).toBe(end);
    });
    
    it('should apply highlighting rules', () => {
      const start = new Date(2022, 1, 15).getTime(); // Feb 15, 2022 (Tuesday)
      const end = new Date(2022, 1, 22).getTime(); // Feb 22, 2022 (Tuesday)
      
      // Highlight weekends (Saturday = 6, Sunday = 0)
      const highlightRule: HighlightOptions = {
        unit: 'day',
        fractions: [0, 6]
      };
      
      const periods = divideTimeRange(start, end, 'day', 1, highlightRule);
      
      // Find the weekend days
      const saturdayIndex = periods.findIndex(p => 
        new Date(p.from).getDay() === 6
      );
      
      const sundayIndex = periods.findIndex(p => 
        new Date(p.from).getDay() === 0
      );
      
      expect(periods[saturdayIndex].isHighlighted).toBe(true);
      expect(periods[sundayIndex].isHighlighted).toBe(true);
      
      // A weekday should not be highlighted
      const wednesdayIndex = periods.findIndex(p => 
        new Date(p.from).getDay() === 3
      );
      
      expect(periods[wednesdayIndex].isHighlighted).toBe(false);
    });
  });

  describe('isHighlighted', () => {
    it('should correctly identify hours to highlight', () => {
      const rule: HighlightOptions = {
        unit: 'hour',
        fractions: [9, 17] // 9am and 5pm
      };
      
      const nineAM = new Date(2022, 1, 15, 9, 0);
      const fivePM = new Date(2022, 1, 15, 17, 0);
      const noon = new Date(2022, 1, 15, 12, 0);
      
      expect(isHighlighted(nineAM, rule)).toBe(true);
      expect(isHighlighted(fivePM, rule)).toBe(true);
      expect(isHighlighted(noon, rule)).toBe(false);
    });
    
    it('should correctly identify weekdays to highlight', () => {
      const rule: HighlightOptions = {
        unit: 'day',
        fractions: [1, 3, 5] // Monday, Wednesday, Friday
      };
      
      const monday = new Date(2022, 1, 14); // Feb 14, 2022 (Monday)
      const wednesday = new Date(2022, 1, 16); // Feb 16, 2022 (Wednesday)
      const saturday = new Date(2022, 1, 19); // Feb 19, 2022 (Saturday)
      
      expect(isHighlighted(monday, rule)).toBe(true);
      expect(isHighlighted(wednesday, rule)).toBe(true);
      expect(isHighlighted(saturday, rule)).toBe(false);
    });
  });
});

describe('getExactDuration', () => {
  it('should correctly calculate leap year durations', () => {
    // 2020 is a leap year
    const leapYear = new Date(2020, 0, 1); // Jan 1, 2020
    const leapYearDuration = getExactDuration('year', leapYear, 1);
    
    // 2021 is not a leap year
    const normalYear = new Date(2021, 0, 1); // Jan 1, 2021
    const normalYearDuration = getExactDuration('year', normalYear, 1);
    
    // Leap year should be 366 days
    expect(leapYearDuration).toBe(366 * 24 * 60 * 60 * 1000);
    
    // Normal year should be 365 days
    expect(normalYearDuration).toBe(365 * 24 * 60 * 60 * 1000);
  });
  
  it('should correctly calculate month durations with different lengths', () => {
    // January has 31 days
    const january = new Date(2023, 0, 1); // Jan 1, 2023
    const januaryDuration = getExactDuration('month', january, 1);
    
    // February has 28 days in 2023
    const february = new Date(2023, 1, 1); // Feb 1, 2023
    const februaryDuration = getExactDuration('month', february, 1);
    
    // February has 29 days in 2020 (leap year)
    const februaryLeap = new Date(2020, 1, 1); // Feb 1, 2020
    const februaryLeapDuration = getExactDuration('month', februaryLeap, 1);
    
    // April has 30 days
    const april = new Date(2023, 3, 1); // Apr 1, 2023
    const aprilDuration = getExactDuration('month', april, 1);
    
    expect(januaryDuration).toBe(31 * 24 * 60 * 60 * 1000); // 31 days
    expect(februaryDuration).toBe(28 * 24 * 60 * 60 * 1000); // 28 days
    expect(februaryLeapDuration).toBe(29 * 24 * 60 * 60 * 1000); // 29 days
    expect(aprilDuration).toBe(30 * 24 * 60 * 60 * 1000); // 30 days
  });
  
  // TODO::
  // it('should handle DST transitions correctly', () => {
  //   // based on timezone
  //   const beforeDST = new Date(2023, 2, 28); // March 28-29, 2023 EU-HR
  //   const dstTransitionDay = getExactDuration('day', beforeDST, 1);

  //   const after = addTime(beforeDST, 'day', 1);
  //   console.log(beforeDST);
  //   console.log(after);
  //   console.log((+after - +beforeDST) / 60 / 60 / 1000);
    
  //   // For US timezones that observe DST, March 12, 2023 was 23 hours
  //   // This test might fail in different timezones
  //   if (isDSTObserved()) {
  //     expect(dstTransitionDay).toBe(23 * 60 * 60 * 1000); // 23 hours
  //   } else {
  //     expect(dstTransitionDay).toBe(24 * 60 * 60 * 1000); // 24 hours
  //   }
  // });
});

// function isDSTObserved() {
//   const january = new Date(2023, 0, 1);
//   const july = new Date(2023, 6, 1);
//   return january.getTimezoneOffset() !== july.getTimezoneOffset();
// }