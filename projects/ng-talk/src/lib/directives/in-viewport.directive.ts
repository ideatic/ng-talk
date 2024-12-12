import {Directive, ElementRef, inject, OnDestroy, OnInit, output, input} from "@angular/core";

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
  exportAs: 'inViewport'
})
export class InViewportDirective implements OnDestroy, OnInit {
  // Deps
  private _host = inject(ElementRef);
  private _window = inject(Window);

  // Bindings
  public readonly inViewportOptions = input<IntersectionObserverInit & {
    delay?: number;
}>(undefined);
  public readonly inViewportChange = output<boolean>();

  // State
  private _inViewport: boolean;
  protected observer: IntersectionObserver;

  public ngOnInit() {
    if (InViewportDirective.intersectionObserverFeatureDetection()) {
      const activateObserver = () => {
        this.observer = new this._window['IntersectionObserver'](
          this.intersectionObserverCallback.bind(this),
          this.inViewportOptions()
        );

        this.observer.observe(this._host.nativeElement);
      };

      const inViewportOptions = this.inViewportOptions();
      if (inViewportOptions?.delay) {
        setTimeout(activateObserver, inViewportOptions.delay);
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
