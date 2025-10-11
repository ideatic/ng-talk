import { formatDate } from '@angular/common';
import type { PipeTransform } from '@angular/core';
import { inject, LOCALE_ID, Pipe } from '@angular/core';
import type { NgTalkSettings } from '../components/ng-talk-settings';
import { daysDiff } from '../utils/utils';

@Pipe({
  name: 'relativeDate'
})
export class RelativeDatePipe implements PipeTransform {
  private readonly _locale = inject(LOCALE_ID);

  public transform(date: Date, settings: NgTalkSettings): string {
    const now = new Date();
    const days = daysDiff(date, now);

    if (days == 0) {
      return settings.todayText;
    } else if (days == -1) {
      return settings.yesterdayText;
    } else {
      return formatDate(date, 'shortDate', this._locale);
    }
  }
}
