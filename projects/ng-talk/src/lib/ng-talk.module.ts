import {NgModule} from '@angular/core';
import {NgTalkChannelComponent} from './components/ng-talk-channel/ng-talk-channel.component';
import {CommonModule, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InViewportDirective} from './directives/in-viewport.directive';
import {NgTalkChannelsComponent} from './components/ng-talk-channels/ng-talk-channels.component';
import {FilterChannelsPipe} from './pipes/filterChannels.pipe';
import {FormatDatePipe} from './pipes/formatDate.pipe';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {BubbleChannelService} from './service/bubble-channel.service';
import {NgTalkBubbleChannelComponent} from './components/ng-talk-bubble-channel/ng-talk-bubble-channel.component';
import {NgTalkSendMessageComponent} from './components/ng-talk-channel/send/ng-talk-send-message.component';
import {NgTalkChannelHeaderComponent} from './components/ng-talk-channel/header/ng-talk-channel-header.component';
import {FnPipe} from './pipes/fn.pipe';
import {NgTalkChannelPreviewComponent} from './components/ng-talk-channels/preview/ng-talk-channel-preview.component';
import {MatMenuModule} from '@angular/material/menu';
import {NgTalkChannelMessageRefComponent} from './components/ng-talk-channel/message/ref/ng-talk-channel-message-ref.component';
import {NgTalkChannelMessageBodyComponent} from './components/ng-talk-channel/message/body/ng-talk-channel-message-body.component';
import {AutoLinkerService} from './service/autolinker.service';
import {NgTalkChannelMessageWritingComponent} from './components/ng-talk-channel/message/body/ng-talk-channel-message-writing.component';
import {NgTalkChannelMessageComponent} from './components/ng-talk-channel/message/ng-talk-channel-message.component';
import {NgTalkSendEmojiComponent} from './components/ng-talk-channel/send/emoji/ng-talk-send-emoji.component';
import {NgTalkSendGifComponent} from './components/ng-talk-channel/send/gif/ng-talk-send-gif.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DragDropModule,
    MatMenuModule
  ],
  providers: [
    DatePipe,
    BubbleChannelService,
    AutoLinkerService,
    {provide: Window, useValue: window}
  ],
  declarations: [
    NgTalkChannelComponent,
    NgTalkChannelsComponent,
    NgTalkChannelPreviewComponent,
    NgTalkChannelMessageComponent,
    NgTalkChannelMessageBodyComponent,
    NgTalkChannelMessageRefComponent,
    NgTalkChannelMessageWritingComponent,
    NgTalkBubbleChannelComponent,
    NgTalkChannelHeaderComponent,
    NgTalkSendMessageComponent,
    NgTalkSendEmojiComponent,
    NgTalkSendGifComponent,
    InViewportDirective,
    FilterChannelsPipe,
    FormatDatePipe,
    FnPipe
  ],
  exports: [
    NgTalkChannelComponent,
    NgTalkChannelsComponent
  ]
})
export class NgTalkModule {
}
