import {CdkDrag, CdkDragEnd, CdkDragMove} from '@angular/cdk/drag-drop';
import {OverlayContainer} from '@angular/cdk/overlay';
import {DecimalPipe} from "@angular/common";
import {ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, forwardRef, HostListener, Input, signal, viewChild} from '@angular/core';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {fromEvent, Subscription} from 'rxjs';
import {ChatAdapter} from '../../models/chat-adapter';
import {ChatChannel} from '../../models/chat-channel';
import {ChatUser} from '../../models/chat-user';
import {BubbleChannelRef} from "../../service/bubble-channel-ref";
import {NgTalkChannelComponent} from '../channel/ng-talk-channel.component';
import {NgTalkSettings} from '../ng-talk-settings';

@Component({
  selector: 'channel-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // https://dev.to/loukaskotas/the-power-of-forwardref-to-fix-circular-dependencies-in-angular-337k
  imports: [forwardRef(() => NgTalkChannelComponent), DecimalPipe, CdkDrag],
  template: `
    <div #bubble class="bubble"
         cdkDrag
         [title]="channel.name"
         [style.background-image]="'url( ' + (channel.icon || channelSettings.defaultChannelIcon) + ')'"
         [class]="bubbleClass()"
         [cdkDragBoundary]="dragBoundarySelector"
         (click)="toggleChannel()"
         (cdkDragStarted)="onDragStart()"
         (cdkDragMoved)="onDragMoved($event)"
         (cdkDragEnded)="onDragEnded($event)">
      @if (!channelVisible() && channel.unread() > 0) {
        <div class="unread-badge">{{ channel.unread() | number }}</div>
      }
    </div>

    @defer (on idle) {
      <ng-talk-channel [class]="channelClass()" [style]="channelStyle" [channel]="channel" [user]="user"
                       [adapter]="adapter" [settings]="channelSettings"
                       [disableRendering]="!channelVisible()" (deleted)="onChatDeleted()"/>
    }

    @if (dragPosition()) {
      <div #closeButton class="close-bubble" [class.active]="isOverCloseBtn()" [class]="closeBtnAnimationClass()">&times;</div>
    }
  `,
  styleUrl: `ng-talk-bubble-channel.component.less`
})
export class NgTalkBubbleChannelComponent {

  @Input() public dragBoundarySelector = 'body';
  @Input() public channel: ChatChannel;
  @Input() public adapter: ChatAdapter;
  @Input() public channelSettings: NgTalkSettings;
  @Input() public user: ChatUser;
  @Input() public selfRef: BubbleChannelRef;

  private _bubbleElement = viewChild.required('bubble', {read: ElementRef<HTMLElement>});
  private _ngTalkChannel = viewChild.required(NgTalkChannelComponent);
  private _closeButton = viewChild('closeButton', {read: ElementRef<HTMLElement>});

  protected bubbleClass = signal('');

  protected channelVisible = signal(false);
  protected channelClass = signal('bounceIn');
  protected channelStyle: { [key: string]: string | number } = {display: 'none'};

  protected dragPosition = signal<{ x: number; y: number; }>(null);

  protected isOverCloseBtn = computed(() => {
    if (this.dragPosition() && this._closeButton()) {
      return this._isOver(this.dragPosition().x, this.dragPosition().y, this._closeButton().nativeElement, 20);
    } else {
      return false;
    }
  });
  protected closeBtnAnimationClass = signal('');

  private _documentClickSubscription: Subscription;

  constructor(private _host: ElementRef<HTMLElement>,
              private _destroyRef: DestroyRef,
              private _overlayContainer: OverlayContainer) {
  }

  /* Dragging */

  protected onDragStart() {
    if (this.channelVisible()) {
      this.close();
    }
  }

  protected onDragMoved(event: CdkDragMove) {
    this.dragPosition.set(event.pointerPosition);
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
    if (this.isOverCloseBtn()) { // Close chat
      this.closeBtnAnimationClass.set('bounceOut');
      this.bubbleClass.set('fadeOut');

      setTimeout(() => this.selfRef.destroy(), 250);

      return;
    }

    this.closeBtnAnimationClass.set('bounceOut');

    setTimeout(() => {
      this.dragPosition.set(null);
      event.source.reset();
      this.closeBtnAnimationClass.set(null);
    }, 250);

    this.close();
    this._restoreBubblePosition();
  }

  private _restoreBubblePosition() {
    const containerWidth = this._container.clientWidth;

    const bubbleStyles = this._bubbleElement().nativeElement.style;

    let x;
    if (this.dragPosition()?.x > containerWidth / 2) { // Move to the right
      x = containerWidth - this._bubbleElement().nativeElement.offsetWidth;
    } else { // Move to the left
      x = 0;
    }

    bubbleStyles.transform = '';
    bubbleStyles.top = (this.dragPosition() ? this.dragPosition().y : 35) + 'px';
    bubbleStyles.left = x + 'px';
  }

  /* Visibility */

  protected toggleChannel() {
    if (this.dragPosition()) {
      return;
    }

    if (this.channelVisible()) {
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
    if (this.channelVisible()) {
      return;
    }

    const containerWidth = this._container.clientWidth;

    const bubbleSize = this._bubbleElement().nativeElement.offsetWidth;

    // Position channel
    const channelX = Math.max(containerWidth / 2 - 400 / 2, 0);

    this.channelClass.set('bounceIn');
    this.channelStyle = {
      left: `${channelX}px`,
      display: undefined
    };

    // Position bubble and channel
    const bubbleStyles = this._bubbleElement().nativeElement.style;
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

    this.channelVisible.set(true);

    setTimeout(() => {
      this._ngTalkChannel().scrollToBottom();
      this._documentClickSubscription = fromEvent(document, 'click')
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe(event => this.onDocumentClick(event));
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
    const bubbleSize = this._bubbleElement().nativeElement.offsetWidth;

    // Fix channel height
    if (containerHeight < 600) {
      this.channelStyle.height = Math.min(Math.max(200, containerHeight - bubbleSize - 10), 400) + 'px';
    } else {
      this.channelStyle.height = undefined;
    }
  }

  public close() {
    if (this.channelVisible()) {
      this.channelClass.set('bounceOut');

      setTimeout(() => {
        this.channelVisible.set(false);
        this.channelStyle = {display: 'none'};
      }, 300);
    }

    this._documentClickSubscription?.unsubscribe();
    this._documentClickSubscription = null;
  }

  public onDocumentClick($event) {
    if (!this.channelVisible()) {
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
}
