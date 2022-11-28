import {NgModule} from '@angular/core';
import {NgTalkChannelComponent} from './components/channel/ng-talk-channel.component';
import {CommonModule, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InViewportDirective} from './directives/in-viewport.directive';
import {NgTalkChannelListComponent} from './components/channel-list/ng-talk-channel-list.component';
import {RelativeDatePipe} from './pipes/relativeDate.pipe';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {BubbleChannelService} from './service/bubble-channel.service';
import {NgTalkBubbleChannelComponent} from './components/bubble/ng-talk-bubble-channel.component';
import {NgTalkSendMessageComponent} from './components/channel/send/ng-talk-send-message.component';
import {NgTalkChannelHeaderComponent} from './components/channel/header/ng-talk-channel-header.component';
import {FnPipe} from './pipes/fn.pipe';
import {NgTalkChannelPreviewComponent} from './components/channel/preview/ng-talk-channel-preview.component';
import {NgTalkChannelMessageRefComponent} from './components/channel/message/ref/ng-talk-channel-message-ref.component';
import {NgTalkChannelMessageBodyComponent} from './components/channel/message/body/ng-talk-channel-message-body.component';
import {AutoLinkerService} from './service/autolinker.service';
import {NgTalkChannelMessageWritingComponent} from './components/channel/message/body/ng-talk-channel-message-writing.component';
import {NgTalkChannelMessageComponent} from './components/channel/message/ng-talk-channel-message.component';
import {NgTalkSendEmojiComponent} from './components/channel/send/emoji/ng-talk-send-emoji.component';
import {NgTalkSendGifComponent} from './components/channel/send/gif/ng-talk-send-gif.component';
import {HttpClientModule} from '@angular/common/http';
import {MatMenuModule} from '@angular/material/menu';


/** @deprecated */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DragDropModule,
    MatMenuModule,
    NgTalkChannelComponent,
    NgTalkChannelListComponent,
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
    RelativeDatePipe,
    FnPipe
  ],
  providers: [
    DatePipe,
    BubbleChannelService,
    AutoLinkerService,
    {provide: Window, useValue: window}
  ],
  exports: [
    NgTalkChannelComponent,
    NgTalkChannelListComponent
  ]
})
export class NgTalkModule {
}
