import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {NgTalkModule} from "../../projects/ng-talk/src/lib/ng-talk.module";
import {FormsModule} from "@angular/forms";
import {AngularFireModule} from "@angular/fire";
import {AngularFirestoreModule} from "@angular/fire/firestore";


// https://console.firebase.google.com/
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "",
    databaseURL: "",
    projectId: "YOUR_PROJECT_ID",
    messagingSenderId: ""
};

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        AngularFireModule.initializeApp(firebaseConfig),
        AngularFirestoreModule,
        NgTalkModule
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {
}
