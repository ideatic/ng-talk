import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

/**
 * From https://github.com/thisissoon/angular-inviewport
 *
 * A simple lightweight library for Angular with that detects when an
 * element is within the browsers viewport and adds a `in-viewport` or
 * `not-in-viewport` class to the element.
 *
 * @example
 * ```html
 * <p
 *  class="foo"
 *  snInViewport
 *  (inViewportChange)="myEventHandler($event)">
 *  Amet tempor excepteur occaecat nulla.
 * </p>
 * ```
 */

@Directive({
  selector: '[inViewport]',
  exportAs: 'inViewport',
  standalone: true
})
export class InViewportDirective implements OnDestroy, OnInit {
  @Input() public inViewportOptions: IntersectionObserverInit & { delay?: number };
  @Output() public inViewportChange = new EventEmitter<boolean>();

  private _inViewport: boolean;
  protected observer: IntersectionObserver;

  constructor(private _host: ElementRef,
              private _window: Window) {
  }

  public ngOnInit() {
    if (InViewportDirective.intersectionObserverFeatureDetection()) {
      const activateObserver = () => {
        this.observer = new this._window['IntersectionObserver'](
          this.intersectionObserverCallback.bind(this),
          this.inViewportOptions
        );

        this.observer.observe(this._host.nativeElement);
      };

      if (this.inViewportOptions?.delay) {
        setTimeout(activateObserver, this.inViewportOptions.delay);
      } else {
        activateObserver();
      }

    } else {
      this._inViewport = true;
      this.inViewportChange.emit(this._inViewport);
    }
  }

  public ngOnDestroy() {
    this.observer?.unobserve(this._host.nativeElement);
  }

  protected intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (this._inViewport !== entry.isIntersecting) {
        this._inViewport = entry.isIntersecting;
        this.inViewportChange.emit(this._inViewport);
      }
    });
  }

  public static intersectionObserverFeatureDetection(): boolean {
    // Exits early if all IntersectionObserver and IntersectionObserverEntry
    // features are natively supported.
    if (
      'IntersectionObserver' in window &&
      'IntersectionObserverEntry' in window
    ) {
      // Minimal polyfill for Edge 15's lack of `isIntersecting`
      // See: https://github.com/w3c/IntersectionObserver/issues/211
      if (
        !(
          'isIntersecting' in
          window['IntersectionObserverEntry']['prototype']
        )
      ) {
        Object.defineProperty(
          window['IntersectionObserverEntry']['prototype'],
          'isIntersecting',
          {
            get: function () {
              return this.intersectionRatio > 0;
            }
          }
        );
      }
      return true;
    }
    return false;
  }
}
