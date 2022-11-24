import {Component, EventEmitter, Output} from '@angular/core';
import emoji from './emoji.json';
import {NgTalkChannelComponent} from '../../ng-talk-channel.component';
import {KeyValue} from '@angular/common';

@Component({
  selector: 'ng-talk-send-emoji',
  template: `
    <input type="search" [(ngModel)]="searchQuery" [placeholder]="chat.settings.search"/>
    <div>
      <span *ngFor="let pair of emoji | keyvalue | fn:filter:this:searchQuery" (click)="emojiSelected.emit(pair.value)">{{ pair.value }}</span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 100%;
      padding: 10px;
    }

    input {
      background: #e9edef;
      width: 100%;
      border: none;
      border-radius: 5px;
      margin-bottom: 10px;
      outline: none;
      padding: 10px 12px;
      font-size: 15px;
    }

    div {
      display: grid;
      gap: 10px;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;
      width: 100%;
      grid-template-columns: repeat(auto-fit, minmax(25px, 1fr));
    }

    span {
      font-size: 20px;
      cursor: pointer;
    }
  `]
})
export class NgTalkSendEmojiComponent {
  @Output() public emojiSelected = new EventEmitter<string>();

  protected readonly emoji = emoji;
  protected searchQuery: string;

  constructor(public chat: NgTalkChannelComponent) {

  }

  public filter(entries: KeyValue<string, string>[], searchQuery: string): KeyValue<string, string>[] {
    return (searchQuery
      ? entries.filter(pair => pair.key.toLowerCase().includes(searchQuery.toLowerCase()))
      : entries)
      .sort((a, b) => b.key.indexOf('face') - a.key.indexOf('face'));
  }
}
