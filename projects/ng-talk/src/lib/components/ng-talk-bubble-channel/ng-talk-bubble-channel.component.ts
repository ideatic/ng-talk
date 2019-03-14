import {Component, ElementRef, Input, OnDestroy, ViewChild} from '@angular/core';
import {CdkDragEnd, CdkDragMove} from '@angular/cdk/drag-drop';
import {ChatChannel} from '../../models/chat-channel';
import {ChatAdapter} from '../../models/chat-adapter';
import {NgTalkSettings} from '../ng-talk-settings';
import {ChatUser} from '../../models/chat-user';
import {BubbleChannelRef} from '../../service/bubble-channel.service';
import {NgTalkChannelComponent} from '../ng-talk-channel/ng-talk-channel.component';
import {bindEvent} from "../../utils/utils";


@Component({
    selector: 'channel-bubble',
    template: `
        <div #bubble class="bubble"
             [title]="channel.name"
             [ngStyle]="{backgroundImage: 'url( ' + (channel.icon || channelSettings.defaultChannelIcon) + ')'}"
             [ngClass]="bubbleClass"
             (click)="toggleChannel()"
             cdkDrag [cdkDragBoundary]="dragBoundarySelector"
             (cdkDragStarted)="onDragStart()"
             (cdkDragMoved)="onDragMoved($event)"
             (cdkDragEnded)="onDragEnded($event)">
            <div *ngIf="!channelVisible && channel.unread > 0" class="unread-badge">{{ channel.unread | number }}</div>
        </div>

        <ng-talk-channel #ngTalkChannel
                         [ngClass]="channelClass"
                         [ngStyle]="channelStyle"
                         [channel]="channel"
                         [user]="user"
                         [adapter]="adapter"
                         [settings]="channelSettings"
                         [disableRendering]="!channelVisible"></ng-talk-channel>

        <div *ngIf="isDragging" #closeButton class="close-bubble" [ngClass]="closeButtonClass">&times;</div>
    `,
    styleUrls: [`ng-talk-bubble-channel.component.less`]
})
export class NgTalkBubbleChannelComponent implements OnDestroy {

    @Input() public dragBoundarySelector = 'body';
    @Input() public channel: ChatChannel;
    @Input() public adapter: ChatAdapter;
    @Input() public channelSettings: NgTalkSettings;
    @Input() public user: ChatUser;
    @Input() public selfRef: BubbleChannelRef;

    @ViewChild('bubble') public bubbleElement: ElementRef<HTMLElement>;
    @ViewChild('ngTalkChannel') public ngTalkChannel: NgTalkChannelComponent;
    @ViewChild('closeButton') public closeButton: ElementRef<HTMLElement>;

    public bubbleClass = '';

    public channelVisible = false;
    public channelClass = 'bounceIn';
    public channelStyle: { [key: string]: string } = {display: 'none'};

    public closeButtonClass = '';

    public isDragging = false;
    private _lastPosition: { x: number; y: number; };

    private _documentClickSubscription: () => void;

    constructor(private _host: ElementRef<HTMLElement>) {

    }

    /* Dragging */

    public onDragStart() {
        if (this.channelVisible) {
            this.close();
        }
    }

    public onDragMoved(event: CdkDragMove) {
        this.isDragging = true;
        this._lastPosition = event.pointerPosition;

        if (this.closeButton) {
            this.closeButtonClass = this._isOver(event.pointerPosition.x, event.pointerPosition.y, this.closeButton.nativeElement, 20)
                ? 'active' : '';
        }
    }

    private _isOver(x: number, y: number, element: HTMLElement, margin = 0) {
        if (x > element.offsetLeft - margin && x < element.offsetLeft + element.offsetWidth + margin) {
            if (y > element.offsetTop - margin && y < element.offsetTop + element.offsetHeight + margin) {
                return true;
            }
        }
        return false;
    }

    public onDragEnded(event: CdkDragEnd) {
        if (this.closeButtonClass == 'active') { // Close chat
            this.closeButtonClass = 'bounceOut';
            this.bubbleClass = 'fadeOut';

            setTimeout(() => {
                this.selfRef.destroy();
            }, 250);

            return;
        }

        this.closeButtonClass = 'bounceOut';

        setTimeout(() => {
            this.isDragging = false;
            event.source.reset();
            this.closeButtonClass = '';
        }, 250);

        this.close();
        this._restoreBubblePosition();
    }

    private _restoreBubblePosition() {
        const container = document.querySelector(this.dragBoundarySelector) || document.documentElement;
        const containerWidth = container.clientWidth;

        const bubbleStyles = this.bubbleElement.nativeElement.style;

        let x;
        if (this._lastPosition && this._lastPosition.x > containerWidth / 2) { // Move to the right
            x = containerWidth - this.bubbleElement.nativeElement.offsetWidth;
        } else { // Move to the left
            x = 0;
        }

        bubbleStyles.transform = '';
        bubbleStyles.top = (this._lastPosition ? this._lastPosition.y : 0) + 'px';
        bubbleStyles.left = x + 'px';
    }

    /* Visibility */

    public toggleChannel() {
        if (this.isDragging) {
            return;
        }

        if (this.channelVisible) {
            this.close();

            // Restore bubble position
            this._restoreBubblePosition();
        } else {
            this.open();
        }
    }

    public open() {
        if (this.channelVisible) {
            return;
        }

        const container = document.querySelector(this.dragBoundarySelector) || document.documentElement;
        const containerWidth = container.clientWidth;
        const bubbleWidth = this.bubbleElement.nativeElement.offsetWidth;

        // Position channel
        const channelX = Math.max(containerWidth / 2 - 400 / 2, 0);

        this.channelClass = 'bounceIn';
        this.channelStyle = {
            left: channelX + 'px',
            display: undefined
        };

        // Position bubble
        const bubbleStyles = this.bubbleElement.nativeElement.style;
        bubbleStyles.transform = '';

        if (containerWidth < 400 + 25 + bubbleWidth) {
            bubbleStyles.top = (150 - bubbleWidth - 10) + 'px';
        } else {
            bubbleStyles.top = 150 + 'px';
            bubbleStyles.left = Math.max(channelX - bubbleWidth - 25, 0) + 'px';
        }

        this.channelVisible = true;

        setTimeout(() => {
            this.ngTalkChannel.scrollToBottom();
            this._documentClickSubscription = bindEvent(document, 'click', (event) => this.onDocumentClick(event));
        }, 10);
    }

    public close() {
        if (this.channelVisible) {
            this.channelClass = 'bounceOut';

            window.setTimeout(() => {
                this.channelVisible = false;
                this.channelStyle = {display: 'none'};
            }, 300);
        }

        if (this._documentClickSubscription) {
            this._documentClickSubscription();
            this._documentClickSubscription = null;
        }
    }

    public onDocumentClick($event) {
        if (!this.channelVisible) {
            return;
        }

        const insideClick = $event && (this._host && this._host.nativeElement.contains($event.target));

        if (!insideClick) {
            this.close();

            // Restore bubble position
            this._restoreBubblePosition();
        }
    }

    public ngOnDestroy() {
        if (this._documentClickSubscription) {
            this._documentClickSubscription();
        }
    }
}
