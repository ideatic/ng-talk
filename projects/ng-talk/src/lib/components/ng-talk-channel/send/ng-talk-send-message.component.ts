import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {NgTalkChannelComponent} from "../ng-talk-channel.component";
import {ChatMessage, ChatMessageType} from "../../../models/chat-message";


@Component({
    template: `
        <form (ngSubmit)="sendMessage()">
            <input #textInput class="input" [(ngModel)]="newMessage" name="newMessage" maxlength="1000" autocomplete="off"
                   [placeholder]="chat.settings.writePlaceholder" (focus)="onInputFocus()"/>
            <i class="send-icon fas fa-paper-plane" (click)="sendMessage()"></i>
        </form>
    `,
    styleUrls: ['ng-talk-send-message.component.less']
})
export class NgTalkSendMessageComponent implements AfterViewInit {

    @ViewChild('textInput') public textInput: ElementRef<HTMLElement>;
    public newMessage: string;

    constructor(public chat: NgTalkChannelComponent) {

    }


    public ngAfterViewInit() {
        this.focus();
    }


    public sendMessage() {
        if (this.newMessage) {
            const message: ChatMessage = {
                type: ChatMessageType.Text,
                from: this.chat.user,
                content: this.newMessage
            };
            this.chat.adapter.sendMessage(this.chat.channel, message)
                .then(() => this.chat.messageSent.emit(message));

            this.newMessage = '';
        }
    }

    public focus() {
        if (this.textInput) {
            this.textInput.nativeElement.focus();
        }
    }

    public onInputFocus() {
        // Mark as read if component is focused
        if (this.chat.channel && this.chat.channel.unread > 0 && document.hasFocus()) {
            this.chat.adapter.markAsRead(this.chat.channel);
        }
    }
}
