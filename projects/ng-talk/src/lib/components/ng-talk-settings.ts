import {Type} from "@angular/core";

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

    public allowLoadOldMessages = true;
    public sendMessageComponent: Type<any>;

    /* i18n */

    public writePlaceholder = 'Write a message...';
    public loadMoreText = 'Load more';
    public todayText = 'Today';
    public yesterdayText = 'Yesterday';

    constructor(params?: Partial<NgTalkSettings>) {
        if (params) {
            Object.assign(this, params);
        }
    }
}
