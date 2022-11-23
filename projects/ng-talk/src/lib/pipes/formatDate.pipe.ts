import {Pipe, PipeTransform} from '@angular/core';
import {daysDiff} from '../utils/utils';
import {DatePipe} from '@angular/common';
import {NgTalkSettings} from "../components/ng-talk-settings";

@Pipe({
  name: 'formatDate',
  standalone: true
})
export class FormatDatePipe implements PipeTransform {

  constructor(private _datePipe: DatePipe) {

  }

  public transform(date: Date, settings: NgTalkSettings): string {
    const now = new Date();
    const days = daysDiff(date, now);

    if (days == 0) {
      return settings.todayText;
    } else if (days == -1) {
      return settings.yesterdayText;
    } else {
      return this._datePipe.transform(date, 'shortDate');
    }
  }
}
