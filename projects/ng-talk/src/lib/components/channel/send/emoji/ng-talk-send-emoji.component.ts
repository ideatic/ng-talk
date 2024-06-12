import {ChangeDetectionStrategy, Component, inject, output} from "@angular/core";
import {KeyValue, KeyValuePipe} from '@angular/common';
import {FormsModule} from "@angular/forms";
import {FnPipe} from "../../../../pipes/fn.pipe";
import {NgTalkChannelComponent} from '../../ng-talk-channel.component';
import emojis from './emoji.json';

@Component({
  selector: 'ng-talk-send-emoji',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, KeyValuePipe, FnPipe],
  template: `
    <input type="search" [placeholder]="chat.settings.search" [(ngModel)]="searchQuery"/>
    <div>
      @for (pair of emojis | keyvalue | fn:filter:this:searchQuery; track pair) {
        <span (click)="emojiSelected.emit(pair.value)">{{ pair.value }}</span>
      }
    </div>
  `,
  styles: `
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
  `
})
export class NgTalkSendEmojiComponent {
  // Deps
  protected readonly chat = inject(NgTalkChannelComponent);

  // Bindings
  public readonly emojiSelected = output<string>();

  // State
  protected readonly emojis = emojis;
  protected searchQuery: string;

  protected filter(entries: KeyValue<string, string>[], searchQuery: string): KeyValue<string, string>[] {
    return (searchQuery
      ? entries.filter(pair => pair.key.toLowerCase().includes(searchQuery.toLowerCase()))
      : entries)
      .sort((a, b) => b.key.indexOf('face') - a.key.indexOf('face'));
  }
}
