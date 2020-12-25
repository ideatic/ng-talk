import {Type} from '@angular/core';
import {NgTalkChannelHeaderComponent} from './ng-talk-channel/header/ng-talk-channel-header.component';
import {NgTalkSendMessageComponent} from './ng-talk-channel/send/ng-talk-send-message.component';
import Autolinker from 'autolinker';

export enum ChannelMessagesLoading {
  onlyActive,
  all,
  lazy,
}

export class NgTalkSettings {
  /* Channel list */
  public showFilter = true;
  public filterPlaceholder = 'Search...';
  public mobileBreakpoint = 700;
  public searchIconClass = '';
  public showChannelsIcons = true;
  public defaultChannelIcon = '';

  public channelMessagesLoading = ChannelMessagesLoading.lazy;

  /* Single channel */
  public showAvatars = true;
  public showNames = true;
  public datePipe = 'shortTime';
  public messageClass = '';
  public defaultAvatar;
  public pageSize = 20;
  public autoLinks: boolean | Autolinker = true;

  public allowLoadOldMessages = true;
  public headerComponent: Type<any> = NgTalkChannelHeaderComponent;
  public sendMessageComponent: Type<any> = NgTalkSendMessageComponent;

  /* i18n */

  public writePlaceholder = 'Write a message...';
  public loadMoreText = 'Load more';
  public todayText = 'Today';
  public yesterdayText = 'Yesterday';
  public disabledMessage = 'Blocked conversation';

  constructor(params?: Partial<NgTalkSettings>) {
    if (params) {
      Object.assign(this, params);
    }
  }
}
