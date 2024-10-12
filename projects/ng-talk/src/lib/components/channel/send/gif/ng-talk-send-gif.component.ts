import {ChangeDetectionStrategy, Component, inject, OnInit, output, signal} from "@angular/core";
import {AsyncPipe} from "@angular/common";
import {HttpClient} from '@angular/common/http';
import {FormsModule} from "@angular/forms";
import {debounceTime, map, Observable, Subject} from 'rxjs';
import {FnPipe} from "../../../../pipes/fn.pipe";
import {NgTalkChannelComponent} from '../../ng-talk-channel.component';

@Component({
    selector: 'ng-talk-send-gif',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, AsyncPipe, FnPipe],
    template: `
    <div style="display: flex; align-items: center; margin-bottom: 10px">
      <input type="search" style="flex-grow: 1" [placeholder]="chat.settings.search" [(ngModel)]="searchQuery" (ngModelChange)="searchGIFs($event)"/>

      <!-- Atribución -->
      @if (chat.settings.giphyApiKey) {
        <a href="https://giphy.com/" target="_blank" style="display: flex;align-items: center">
          <svg viewBox="0 0 641 223" style="height: 35px">
            <path fill="currentColor"
                  d="M105.24 12.27c8.65-4.48 18.95-4.78 28.2-2.09 6.33 2.05 11.82 6.29 15.32 11.95 4.26 8.04 5.58 17.73 2.71 26.46-2 8.08-8.26 14.72-15.92 17.8-6.92 2.28-14.45 3.6-21.62 1.63-8.97-1.29-16.85-7.39-20.69-15.54-2.56-6.24-2.56-12.99-2.14-19.61 1.12-8.57 6.25-16.77 14.14-20.6M113 22.81c-11.03 5.32-12.19 22.63-2.74 30.02 4.78 3.94 11.47 4.22 17.31 3.08 1.17-.56 2.35-1.1 3.5-1.69 5.87-2.58 8.13-9.42 8.8-15.33-.41-5.02-2.01-10.33-5.91-13.76-5.54-5.09-14.43-5.75-20.96-2.32ZM36.11 10.03c9.98-.03 19.95-.05 29.93-.02 5.99.45 12.36 2.92 15.75 8.15 4.01 5.5 4.95 12.82 3.03 19.3-2.26 6.78-7.97 12.08-15.11 13.26-6.55.67-13.18.08-19.77.28v16H36.09c.01-18.99-.04-37.98.02-56.97m13.83 12.89v16.09c4.73-.05 9.46.1 14.18-.01 3.02-.01 6.12-1.82 7.38-4.6 1.91-4.29-.21-9.86-4.84-11.26-5.55-.54-11.15-.09-16.72-.22ZM154.7 10.04c4.99-.06 9.97-.02 14.95-.04 4.39 12.13 9.26 24.22 11.66 36.94.78-2.19 1.57-4.37 2.44-6.53l.52-1.83c3.21-9.56 6.33-19.17 9.81-28.64 2.91.06 5.82.07 8.74.05 4.33 11.98 8.72 23.95 12.62 36.08.34-.58 1.03-1.75 1.37-2.34 2.25-11.58 6.43-22.68 10.48-33.73 4.99.02 9.98-.02 14.98.03-2.07 6.18-4.73 12.14-6.59 18.39-4.78 12.82-9.6 25.63-14 38.58-3.79-.01-7.58-.01-11.37 0-4.08-10.17-7.8-20.46-11.89-30.63-3.81 10.24-7.29 20.61-11.53 30.68-3.67-.08-7.34-.08-11 .01-4.83-12.91-9.67-25.81-14.54-38.7-1.91-6.22-4.9-12.05-6.65-18.32Zm94.31-.03h42.98V22c-10-.01-20-.01-30 0 0 3.38 0 6.76.01 10.14 9.32.02 18.65-.02 27.97.03.03 3.94.02 7.88.02 11.83-9.33-.01-18.66-.01-27.99 0-.01 3.66-.01 7.33 0 11 10.33.01 20.66.01 30.99.01V67c-14.66-.01-29.32 0-43.99 0 .01-19 .01-38 .01-56.99Zm54.02.01c10.01.01 20.02-.07 30.02.01 7.74.33 15.02 5.2 17.75 12.54 2.08 5.97 1.48 12.83-2.06 18.14-2.43 3.21-5.98 5.5-9.83 6.62 5.33 6.46 10.98 12.69 15.77 19.58-5.12.16-10.24.05-15.35.11-4.72-5.9-9.43-11.83-13.86-17.95-2.87-.09-5.74-.11-8.61-.12-.01 6.02-.01 12.03 0 18.05h-13.85c.01-19-.01-37.99.02-56.98m13.83 11.6c-.01 5.13-.01 10.27 0 15.41 5.56-.15 11.15.32 16.7-.21 6.88-1.89 6.18-13.33-.59-14.84-5.34-.74-10.75-.23-16.11-.36Zm46.15-11.61c14.29.01 28.58-.04 42.88.02.03 3.99.03 7.97.02 11.95-9.98.03-19.95 0-29.92.02-.01 3.38-.01 6.76 0 10.14 9.33.02 18.65-.02 27.98.02.03 3.95.02 7.89.03 11.83-9.34 0-18.68 0-28.01.01-.01 3.67-.01 7.33 0 11 10.33.02 20.65-.01 30.98.02.02 3.99.01 7.98.02 11.98-14.67-.01-29.33 0-43.99 0 .01-19 .01-38 .01-56.99Zm53.99 0c7.98-.02 15.95.03 23.93-.04 7.9-.19 16.3 2.36 21.6 8.51 7.04 7.64 7.59 19.03 5.7 28.73-2.17 11.14-12.76 20.26-24.24 19.82-9-.06-17.99-.02-26.98-.03 0-19 0-38-.01-56.99M429.99 22c0 11 0 22 .01 33 6.34-.29 13.15 1.12 19.04-1.93 5.22-2.97 7.05-9.39 7.04-15.04-.07-5.15-1.76-11.03-6.59-13.67-5.89-3.59-12.98-2.08-19.5-2.36Zm69.02-11.99c10.67.04 21.34-.08 32 .03 5.17.71 10.91 2.32 14.01 6.88 2.62 3.72 3.76 8.81 2.02 13.14-.94 3.05-3.51 5.13-5.78 7.19 2.49 1.71 4.66 3.82 6.57 6.16 1.6 5.12 2.03 11.05-.64 15.89-3.06 4.64-8.52 7.71-14.1 7.7-11.36.01-22.72-.02-34.08 0V10.01M512 21.86c-.01 3.38-.01 6.76-.01 10.15 5.03-.04 10.06.05 15.09.01 2.52.19 4.74-1.14 6.95-2.12 0-1.91.02-3.81.05-5.72-1.57-.97-3.08-2.4-5.06-2.26-5.67-.2-11.35 0-17.02-.06m0 21.13c-.01 4.21-.02 8.42 0 12.63 5.96-.17 11.95.38 17.88-.34 2.27-.27 5.31-1.51 5.21-4.23.59-3.01-.62-6.58-3.92-7.28-6.22-1.66-12.81-.39-19.17-.78Zm37.6-32.92c5.31-.12 10.63-.04 15.95-.07 4.17 7.4 8.69 14.6 13.11 21.85 4.89-7.12 9.38-14.51 13.99-21.82 5.26-.02 10.53-.09 15.79.05-7.47 11.73-15.3 23.26-23.39 34.55-.12 7.46-.03 14.91-.06 22.37h-12.98c-.02-7.49.04-14.97-.04-22.45-7.74-11.3-15.17-22.83-22.37-34.48ZM75.52 89.25c13.98-3.94 29.03-4.58 43.07-.53l1.85.48c9.76 2.97 18.49 8.99 25.48 16.33.03.34.11 1.01.15 1.35-6.48 6.79-13.47 13.07-20.01 19.81-10.09-9.5-25.21-13.15-38.54-9.43-1.02.34-2.03.67-3.05.98-7.11 2.81-12.94 8.51-15.53 15.73-5.23 13.94-3.98 31.23 6.24 42.63 2.91 3.57 7.32 5.28 11.35 7.24.45.12 1.34.37 1.78.49 4.81.89 9.73 2.23 14.6.96 6.39-.35 12.59-2.36 18.1-5.6v-15.08c-9.66-.05-19.32.08-28.97-.03-1.45.22-1.81-1.48-1.67-2.55l.03-24.95c20.19-.18 40.39-.02 60.59-.08-.02 18.15.03 36.3-.03 54.45-3.9 7.68-10.88 13.18-18.5 16.88-3.44 1.86-7.19 2.98-10.94 3.99-5.4 1.49-10.94 2.79-16.57 2.7-10.88.8-22.01.14-32.46-3.26-2.75-.83-5.48-1.74-8.09-2.96-12.39-5.94-22.7-16.43-27.73-29.28-10.93-25.3-6.02-57.44 14.26-76.67 7.04-6.3 15.46-11.1 24.59-13.6Zm93.54.77c11.97-.03 23.95-.02 35.92-.01 0 40.65.03 81.31-.02 121.96-11.96.03-23.91.06-35.87-.01-.08-40.65-.03-81.3-.03-121.94Zm59.11.01c22.63-.04 45.27-.04 67.9-.01 11.33 1.18 22.63 5.89 30.37 14.44 4.42 4.93 7.49 10.95 9.38 17.27 1.7 9.01 1.92 18.46-.59 27.35-3.9 12.98-14.62 23.63-27.71 27.25-5.03 1.52-10.23 2.85-15.52 2.7-9.34-.07-18.68-.02-28.01-.03-.03 10.99.03 21.98-.03 32.97-11.92.02-23.85.1-35.76-.04-.11-40.63-.05-81.27-.03-121.9M263.99 120c-.01 9.8-.01 19.59 0 29.39 9.51-.12 19.04.33 28.53-.44 8.27-2.73 11.42-12.84 8.36-20.52-2.44-4.43-6.53-8.16-11.82-8.38-8.36-.16-16.72 0-25.07-.05ZM352 90h35c0 15.34-.01 30.67 0 46 14.33.01 28.67 0 43 0 .01-15.33 0-30.66 0-46h35v121.99c-11.67.01-23.33 0-35 .01 0-15.34.01-30.67 0-46-14.33-.01-28.67-.01-43 0-.01 15.33 0 30.66 0 46-11.67 0-23.33-.01-35 0 0-40.67.01-81.33 0-122Zm122.59.07c13.53-.17 27.07.02 40.6-.1 8.06 13.7 16.29 27.3 24.66 40.82 8.43-13.65 17.11-27.15 25.56-40.79 13.2.01 26.4 0 39.6 0l-.04 2.47c-16.15 23.56-32.03 47.29-47.98 70.98.01 16.18 0 32.37 0 48.55-11.66 0-23.33-.01-34.99 0-.03-16.14.06-32.27-.04-48.41-12.5-18.19-23.99-37.08-36.15-55.51-3.64-6.07-7.99-11.7-11.22-18.01Z"/>
          </svg>
        </a>
      } @else if (chat.settings.tenorApiKey) {
        <svg style="height: 35px; margin: 0 10px" viewBox="0 0 835 177">
          <defs>
            <path id="a" d="M0 0h93v176H0z"/>
            <path id="c" d="M0 0h83v137H0z"/>
          </defs>
          <g fill="none" fill-rule="evenodd">
            <path fill="#4A4A4A"
                  d="M410 97c0-5-2-10-4-14a36 36 0 0 0-57-15c-8 7-12 16-15 26v3h76Zm-77 20c1 8 3 14 7 20 8 13 21 20 37 19 13 0 24-4 34-13 5-5 12-4 15 2 3 4 2 8-1 12a70 70 0 0 1-68 17c-23-7-37-21-44-43-8-26-3-50 15-71 12-14 28-20 46-20 16 0 30 6 42 17 9 10 14 22 16 35l2 15c0 6-4 10-10 10h-91ZM706 109c0-13-4-24-13-34a44 44 0 0 0-66 1 52 52 0 0 0 1 65c15 16 41 20 58 7 14-10 19-23 20-39m-114-1c1-35 28-68 69-68 39 0 68 30 68 69 0 38-30 68-69 68-37 0-68-31-68-69M479 59l7-6c10-9 22-13 35-13 11 0 21 2 30 8 11 8 17 19 19 32l1 13 1 72c0 5-3 9-8 11-4 2-8 1-12-3-2-2-3-5-3-9l-1-67-1-13c-4-13-13-21-26-23-10-1-19 1-27 7-11 7-15 18-15 31v66c0 9-8 14-16 11-4-2-7-6-7-11V51c0-4 2-7 6-10 4-2 8-2 12 1 3 2 5 5 5 9v8"/>
            <g transform="translate(209)">
              <mask id="b" fill="#fff">
                <use xlink:href="#a"/>
              </mask>
              <path fill="#4A4A4A"
                    d="M49 42h31c4 0 8 2 10 5 4 7 0 15-7 16H49v73c0 5 1 9 4 13 3 3 6 4 10 5 6 1 11 1 17-1 5-2 11 0 12 5 2 5 0 10-5 13-7 3-14 4-21 5a38 38 0 0 1-40-39V63H11C4 63-1 58 0 51c1-5 5-9 11-9h12c3 0 3 0 3-2V12c0-7 5-12 11-12 7 0 12 5 12 12v30Z"
                    mask="url(#b)"/>
            </g>
            <g transform="translate(752 39)">
              <mask id="d" fill="#fff">
                <use xlink:href="#c"/>
              </mask>
              <path fill="#4A4A4A"
                    d="m23 28 10-11C41 9 50 4 61 2l10-1c7 0 12 6 12 12s-5 12-12 12l-14 2c-12 2-21 10-27 22-5 10-7 20-7 32v44c0 7-5 12-11 12-7 0-12-5-12-12V12C0 7 4 2 9 1c5-2 10 1 12 6l2 6v15"
                    mask="url(#d)"/>
            </g>
            <path fill="#4A4A4A" fill-rule="nonzero"
                  d="m70 74-29 66H29L0 74h13l22 53 24-53h11Zm11 0h12v66H81V74Zm58-1c9 0 16 2 21 7 4 4 7 11 7 20v40h-11v-9c-3 3-5 6-9 7-4 2-8 3-13 3-8 0-14-2-18-6-5-3-7-8-7-14s2-10 7-14c4-3 11-5 20-5h19v-2c0-6-2-10-5-12-3-3-7-4-13-4a35 35 0 0 0-21 7l-5-9 12-7 16-2Zm16 38h-19c-10 0-15 3-15 10 0 3 1 6 4 8s6 3 11 3c4 0 8-2 12-4 3-2 5-4 7-8v-9ZM87 45c2 0 4 1 5 3 2 1 3 3 3 5l-3 6-5 2-6-2-3-6c0-2 1-4 3-5 1-2 3-3 6-3Z"/>
          </g>
        </svg>
      }
    </div>
    <div class="gif-list">
      @for (gif of gifs$() | async; track gif) {
        <span style="text-align: center" (click)="onGifSelected(gif)"><img loading="lazy" [src]="gif | fn:getGifURL:false"/></span>
      }
    </div>
  `,
    styles: `
    :host {
      display: block;
      max-width: 100%;
      padding: 10px;
    }

    input {
      background: #e9edef;
      width: 100%;
      border: none;
      border-radius: 5px;
      outline: none;
      padding: 10px 12px;
      font-size: 15px;
    }

    .gif-list {
      display: grid;
      gap: 10px;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;
      width: 100%;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }
  `
})
export class NgTalkSendGifComponent implements OnInit {
  // Deps
  protected readonly chat = inject(NgTalkChannelComponent);
  private readonly _http = inject(HttpClient);

  // Bindings
  public readonly gifSelected = output<string>();

  // State
  protected searchQuery: string;
  protected gifs$ = signal<Observable<any>>(null);

  private _deBouncer: Subject<string>;

  public ngOnInit() {
    this._getTrendingGIFs();
  }

  private _getTrendingGIFs() {
    if (this.chat.settings.giphyApiKey) {
      this.gifs$.set(this._http.get(`https://api.giphy.com/v1/gifs/trending?rating=g&api_key=${this.chat.settings.giphyApiKey}`)
        .pipe(map((response: any) => response.data)));
    } else if (this.chat.settings.tenorApiKey) {
      this.gifs$.set(this._http.get(` https://tenor.googleapis.com/v2/featured?key=${encodeURIComponent(this.chat.settings.tenorApiKey)}&client_key=ngTalk&limit=8`)
        .pipe(map((response: any) => response.results)));
    }
  }

  protected getGifURL(gif: any, fullSize = true) {
    if (this.chat.settings.giphyApiKey) {
      if (!fullSize && gif.images?.fixed_height_small?.url) {
        return gif.images.fixed_height_small.url;
      } else if (fullSize && gif.images?.downsized?.url) {
        return gif.images.downsized.url;
      }
      return `https://i.giphy.com/media/${gif.id}/200h.gif`;
    } else if (this.chat.settings.tenorApiKey) { // Tenor
      if (fullSize && gif.media_formats.gif) {
        return gif.media_formats.gif.url;
      }

      return gif.media_formats.nanogif?.url ?? gif.media_formats.tinygif?.url ?? gif.media_formats.gif?.url;
    }
  }

  //https://api.giphy.com/v1/gifs/trending?api_key=HmL1Rhx5T8GQj1FTPXuRspqYlnVNYApj
  protected searchGIFs(query: string) {
    if (!this._deBouncer) {
      this._deBouncer = new Subject();
      this._deBouncer.pipe(debounceTime(500))
        .subscribe(query => {
          if (query) {
            if (this.chat.settings.giphyApiKey) {
              this.gifs$.set(this._http.get(`https://api.giphy.com/v1/gifs/search?rating=g&q=${encodeURIComponent(query)}&api_key=${encodeURIComponent(this.chat.settings.giphyApiKey)}`)
                .pipe(map((response: any) => response.data)));
            } else if (this.chat.settings.tenorApiKey) {
              this.gifs$.set(this._http.get(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${encodeURIComponent(this.chat.settings.tenorApiKey)}&client_key=ngTalk&limit=8`)
                .pipe(map((response: any) => response.results)));
            }
          } else {
            this._getTrendingGIFs();
          }
        });
    }

    this._deBouncer.next(query);
  }

  protected onGifSelected(gif: any) {
    this.gifSelected.emit(this.getGifURL(gif, true));

    // Registrar uso del gif
    if (this.chat.settings.giphyApiKey && gif.analytics?.onclick?.url) {
      this._http.get(gif.analytics?.onclick?.url);
    } else if (this.chat.settings.tenorApiKey) {
      this._http.get(`https://tenor.googleapis.com/v2/registershare?id=16989471141791455574&key=${encodeURIComponent(this.chat.settings.tenorApiKey)}&client_key=ngTalk&q=${encodeURIComponent(this.searchQuery)}`);
    }
  }
}
