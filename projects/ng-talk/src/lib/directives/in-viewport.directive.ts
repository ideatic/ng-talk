import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

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
// @dynamic
@Directive({
    selector: '[inViewport]',
    exportAs: 'inViewport'
})
export class InViewportDirective implements AfterViewInit, OnDestroy, OnInit {
    private _window: Window;
    private _inViewport: boolean;
    private _hasIntersectionObserver: boolean;
    @Input() public inViewportOptions: IntersectionObserverInit;
    @Output() public inViewportChange = new EventEmitter<boolean>();
    public observer: IntersectionObserver;

    constructor(private _host: ElementRef) {
        this._window = window;
        this._hasIntersectionObserver = InViewportDirective.intersectionObserverFeatureDetection();
    }

    public ngOnInit() {
        if (!this._hasIntersectionObserver) {
            this._inViewport = true;
            this.inViewportChange.emit(this._inViewport);
        }
    }

    public ngAfterViewInit() {
        if (this._hasIntersectionObserver) {
            const IntersectionObserver = this._window['IntersectionObserver'];
            this.observer = new IntersectionObserver(
                this.intersectionObserverCallback.bind(this),
                this.inViewportOptions
            );

            this.observer.observe(this._host.nativeElement);
        }
    }

    public ngOnDestroy() {
        if (this.observer) {
            this.observer.unobserve(this._host.nativeElement);
        }
    }

    public intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
        entries.forEach(entry => {
            if (this._inViewport === entry.isIntersecting) return;
            this._inViewport = entry.isIntersecting;
            this.inViewportChange.emit(this._inViewport);
        });
    }

    public static intersectionObserverFeatureDetection() {
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