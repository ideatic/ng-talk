import {Injectable} from '@angular/core';
import Autolinker from 'autolinker';

@Injectable()
export class AutoLinkerService {

  private _autoLinker: any;

  public link(text: string): string {
    this._autoLinker ??= new Autolinker({
      urls: {
        schemeMatches: true,
        wwwMatches: true,
        tldMatches: true
      },
      email: true,
      phone: false,
      mention: false,
      hashtag: false,

      stripPrefix: true,
      stripTrailingSlash: true,
      newWindow: true
    });

    return this._autoLinker.link(text);
  }
}
