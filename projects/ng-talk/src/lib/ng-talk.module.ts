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


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule
  ],
  providers: [
    DatePipe,
    BubbleChannelService
  ],
  declarations: [
    NgTalkChannelComponent,
    NgTalkChannelsComponent,
    NgTalkBubbleChannelComponent,

    NgTalkChannelHeaderComponent,
    NgTalkSendMessageComponent,

    InViewportDirective,
    FilterChannelsPipe,
    FormatDatePipe,
    FnPipe
  ],
  exports: [
    NgTalkChannelComponent,
    NgTalkChannelsComponent
  ],
  entryComponents: [
    NgTalkChannelHeaderComponent,
    NgTalkSendMessageComponent,
    NgTalkBubbleChannelComponent
  ]
})
export class NgTalkModule {
}
