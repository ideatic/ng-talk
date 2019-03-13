import {Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {ChatAdapter} from "../../models/chat-adapter";
import {ChatChannel} from "../../models/chat-channel";
import {ChatMessage, ChatMessageType} from "../../models/chat-message";
import {ChatUser} from "../../models/chat-user";
import {Subscription} from "rxjs";
import {NgTalkSettings} from "../ng-talk-settings";
import {isSameDay, nameof} from "../../utils/utils";
import {InViewportDirective} from "../../directives/in-viewport.directive";

interface ExtendedChatMessage extends ChatMessage {
    isDaySeparator: boolean;
    showAuthor: boolean,
    className: string
}

@Component({
    selector: 'ng-talk-channel',
    templateUrl: './ng-talk-channel.component.html',
    styleUrls: [
        './ng-talk-channel.component.less',
        './styles/loading-spinner.less',
        './styles/writing-animation.less'
    ]
})
export class NgTalkChannelComponent implements OnInit, OnChanges, OnDestroy {

    @Input() public user: ChatUser;
    @Input() public adapter: ChatAdapter;
    @Input() public channel: ChatChannel;
    @Input() public settings: NgTalkSettings;
    @Input() public disableRendering = false;

    @Output() public messageSent: EventEmitter<ChatMessage> = new EventEmitter();
    @Output() public userClicked: EventEmitter<ChatUser> = new EventEmitter();

    @ViewChild('chatBox') public chatBox: ElementRef<HTMLElement>;
    @ViewChild('textInput') public textInput: ElementRef<HTMLElement>;

    private _visibleMessages = 20;
    public messages: ExtendedChatMessage[] = [];
    public newMessage: string;

    private _messagesSubscription: Subscription;

    // UI
    public loading = false;
    public scrollWatcherEnabled = false;
    public readonly viewportDetectionAvailable = InViewportDirective.intersectionObserverFeatureDetection();

    // Import types and enums
    public readonly MessageType = ChatMessageType;

    constructor() {

    }

    public ngOnInit() {
        if (!this.user) {
            throw new Error('Chat current user must be defined');
        }
    }

    public ngOnChanges(changes: SimpleChanges) {
        if (!this.settings) {
            this.settings = new NgTalkSettings();
        }

        if (changes[nameof<NgTalkChannelComponent>('adapter')] || changes[nameof<NgTalkChannelComponent>('channel')]) {
            this.messages = [];

            if (this._messagesSubscription) {
                this._messagesSubscription.unsubscribe();
            }
            this._visibleMessages = this.settings.pageSize;

            if (this.adapter && this.channel) {
                this._loadMessages();
            }
        }
    }

    public ngOnDestroy() {
        if (this._messagesSubscription) {
            this._messagesSubscription.unsubscribe();
        }
    }

    private _loadMessages(scrollToBottom = true) {
        if (this._messagesSubscription) {
            this._messagesSubscription.unsubscribe();
        }

        this.loading = true;

        this._messagesSubscription = this.adapter.getMessages(this.channel, 0, this._visibleMessages)
            .subscribe((messages: ExtendedChatMessage[]) => {
                this.messages = messages;
                if (scrollToBottom && !this.disableRendering) {
                    this.scrollToBottom();
                }
                this.loading = false;

                // Preprocess messages
                let prevMessage: ExtendedChatMessage;
                for (const message of messages) {
                    message.className = this.settings.messageClass + ' ' + (message.from.id == this.user.id ? 'sent' : 'received') + ' ' + (this.settings.showAvatars ? 'with-avatar' : '');

                    if (!prevMessage || !isSameDay(prevMessage.date, message.date)) {
                        message.isDaySeparator = true;
                    }

                    message.showAuthor = !prevMessage || prevMessage.from.id != message.from.id || message.isDaySeparator;

                    if (!message.showAuthor && prevMessage) { //
                        prevMessage.className += ' narrow';
                    }

                    prevMessage = message;
                }

                // Mark as read if component is focused
                this.onFocus();
            });
    }


    @HostListener('focus')
    public onFocus() {
        // Mark as read if component is focused
        if (this.channel && this.channel.unread > 0 && document.hasFocus()) {
            this.adapter.markAsRead(this.channel);
        }
    }

    public trackMessage(i, message: ChatMessage) {
        return message.date.toString() + message.content;
    }

    public sendMessage() {
        if (this.newMessage) {
            const message: ChatMessage = {
                type: ChatMessageType.Text,
                from: this.user,
                content: this.newMessage
            };
            this.adapter.sendMessage(this.channel, message)
                .then(() => this.messageSent.emit(message));

            this.newMessage = '';
        }
    }

    public scrollToBottom() {
        if (this.chatBox) {
            window.setTimeout(() => {  // Wait until the new messages are drawn
                this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight;

                if (this.messages.length >= this._visibleMessages) { // Enable scroll watcher if there is more messages pending
                    this.scrollWatcherEnabled = true;
                }
            }, 10);
        }
    }

    public onInputFocus() {
        this.textInput.nativeElement.scrollIntoView();
    }

    // Pagination & History

    public loadOldMessages() {
        this.scrollWatcherEnabled = false;
        this._visibleMessages += this.settings.pageSize;

        this._loadMessages(false);
    }

    public watcherInViewportChanged(isVisible: boolean) {
        if (isVisible) {
            this.loadOldMessages();
        }
    }
}
