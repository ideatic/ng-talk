import {Component, ElementRef, HostListener, Input, OnDestroy, ViewChild} from '@angular/core';
import {CdkDragEnd, CdkDragMove, DragDropModule} from '@angular/cdk/drag-drop';
import {ChatChannel} from '../../models/chat-channel';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatUser} from '../../models/chat-user';
import {fromEvent, Subscription} from 'rxjs';
import {OverlayContainer} from '@angular/cdk/overlay';
import {DecimalPipe, NgClass, NgIf, NgStyle} from "@angular/common";
import {BubbleChannelRef} from "../../service/bubble-channel-ref";
import {NgTalkChannelComponent} from "../ng-talk-channel/ng-talk-channel.component";
import {NgTalkSettings} from "../ng-talk-settings";

@Component({
  selector: 'channel-bubble',
  standalone: true,
  imports: [NgStyle, NgClass, NgIf, DragDropModule, NgTalkChannelComponent, DecimalPipe],
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
                     [disableRendering]="!channelVisible"
                     (deleted)="onChatDeleted()"></ng-talk-channel>

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

  @ViewChild('bubble', {static: true}) private _bubbleElement: ElementRef<HTMLElement>;
  @ViewChild('ngTalkChannel', {static: true}) private _ngTalkChannel: NgTalkChannelComponent;
  @ViewChild('closeButton') private _closeButton: ElementRef<HTMLElement>;

  public bubbleClass = '';

  public channelVisible = false;
  public channelClass = 'bounceIn';
  public channelStyle: { [key: string]: string | number } = {display: 'none'};

  public closeButtonClass = '';

  public isDragging = false;
  private _lastPosition: { x: number; y: number; };

  private _documentClickSubscription: Subscription;

  constructor(private _host: ElementRef<HTMLElement>,
              private _overlayContainer: OverlayContainer) {
  }

  /* Dragging */

  protected onDragStart() {
    if (this.channelVisible) {
      this.close();
    }
  }

  protected onDragMoved(event: CdkDragMove) {
    this.isDragging = true;
    this._lastPosition = event.pointerPosition;

    if (this._closeButton) {
      this.closeButtonClass = this._isOver(event.pointerPosition.x, event.pointerPosition.y, this._closeButton.nativeElement, 20)
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

  protected onDragEnded(event: CdkDragEnd) {
    if (this.closeButtonClass == 'active') { // Close chat
      this.closeButtonClass = 'bounceOut';
      this.bubbleClass = 'fadeOut';

      setTimeout(() => this.selfRef.destroy(), 250);

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
    const containerWidth = this._container.clientWidth;

    const bubbleStyles = this._bubbleElement.nativeElement.style;

    let x;
    if (this._lastPosition?.x > containerWidth / 2) { // Move to the right
      x = containerWidth - this._bubbleElement.nativeElement.offsetWidth;
    } else { // Move to the left
      x = 0;
    }

    bubbleStyles.transform = '';
    bubbleStyles.top = (this._lastPosition ? this._lastPosition.y : 35) + 'px';
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

  private get _container(): HTMLElement {
    return document.querySelector(this.dragBoundarySelector) || document.documentElement;
  }

  public open() {
    if (this.channelVisible) {
      return;
    }

    const containerWidth = this._container.clientWidth;

    const bubbleSize = this._bubbleElement.nativeElement.offsetWidth;

    // Position channel
    const channelX = Math.max(containerWidth / 2 - 400 / 2, 0);

    this.channelClass = 'bounceIn';
    this.channelStyle = {
      left: channelX + 'px',
      display: undefined
    };

    // Position bubble and channel
    const bubbleStyles = this._bubbleElement.nativeElement.style;
    bubbleStyles.transform = '';

    if (containerWidth < 400 + 25 + bubbleSize) {
      bubbleStyles.top = '0px'; // Math.max(150 - bubbleWidth - 10, 0) + 'px';
      this.channelStyle.top = (bubbleSize + 10) + 'px';
    } else {
      this.channelStyle.top = '150px';
      bubbleStyles.top = '150px';
      bubbleStyles.left = Math.max(channelX - bubbleSize - 25, 0) + 'px';
    }

    // Fix height
    this._onResized();

    this.channelVisible = true;

    setTimeout(() => {
      this._ngTalkChannel.scrollToBottom();
      this._documentClickSubscription = fromEvent(document, 'click').subscribe(event => this.onDocumentClick(event));
    }, 10);
  }

  public onChatDeleted() {
    this.close();
    setTimeout(() => this.selfRef.destroy(), 250);
  }

  @HostListener('window:resize')
  @HostListener('window:deviceorientation')
  @HostListener('window:scroll')
  private _onResized() {
    const containerHeight = this._container.clientHeight;
    const bubbleSize = this._bubbleElement.nativeElement.offsetWidth;

    // Fix channel height
    if (containerHeight < 600) {
      this.channelStyle.height = Math.min(Math.max(200, containerHeight - bubbleSize - 10), 400) + 'px';
    } else {
      this.channelStyle.height = undefined;
    }
  }

  public close() {
    if (this.channelVisible) {
      this.channelClass = 'bounceOut';

      setTimeout(() => {
        this.channelVisible = false;
        this.channelStyle = {display: 'none'};
      }, 300);
    }

    this._documentClickSubscription?.unsubscribe();
    this._documentClickSubscription = null;
  }

  public onDocumentClick($event) {
    if (!this.channelVisible) {
      return;
    }

    const insideClick = $event && (this._host?.nativeElement.contains($event.target))
      // Click en un menú
      || this._overlayContainer.getContainerElement()?.contains($event.target);

    if (!insideClick) {
      this.close();

      // Restore bubble position
      this._restoreBubblePosition();
    }
  }

  public ngOnDestroy() {
    this._documentClickSubscription?.unsubscribe();
  }
}
