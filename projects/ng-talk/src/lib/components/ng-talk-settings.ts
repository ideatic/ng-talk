import type {Type} from '@angular/core';
import type Autolinker from 'autolinker';
import {NgTalkChannelHeaderComponent} from './channel/header/ng-talk-channel-header.component';

export enum MessageLoadingMethod {
  onChannelSelected,
  allChannels,
  lazy
}

export class NgTalkSettings {
  /* Channel list */
  public showFilter = true;
  public filterPlaceholder = 'Search...';
  public selectFirstChannelOnInit = false;
  public mobileBreakpoint = 700;
  public searchIconClass = '';
  public showChannelsIcons = true;
  public defaultChannelIcon = '';

  public channelMessagesLoading = MessageLoadingMethod.lazy;

  /* Single channel */
  public showAvatars = true;
  public showNames = true;
  public allowReplies = true;
  public datePipe = 'shortTime';
  public messageClass = '';
  public defaultAvatar;
  public pageSize = 20;
  public autoLinks: boolean | Autolinker = true;
  public giphyApiKey = null;
  public tenorApiKey = null;

  public allowLoadOldMessages = true;
  public headerComponent: Type<any> = NgTalkChannelHeaderComponent;

  /* i18n */

  public writePlaceholder = 'Write a message...';
  public loadMoreText = 'Load more';
  public todayText = 'Today';
  public yesterdayText = 'Yesterday';
  public disabledMessage = 'Blocked conversation';
  public sendBtnTitle = 'Send';
  public replyBtn = 'Reply';
  public search = 'Search';

  constructor(params?: Partial<NgTalkSettings>) {
    if (params) {
      Object.assign(this, params);
    }
  }
}
