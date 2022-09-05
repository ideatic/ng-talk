import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {NgTalkModule} from '../../projects/ng-talk/src/lib/ng-talk.module';
import {FormsModule} from '@angular/forms';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        NgTalkModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
