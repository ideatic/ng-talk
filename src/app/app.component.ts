import {ChangeDetectionStrategy, inject} from "@angular/core";
import {Component, OnInit} from '@angular/core';
import {DemoAdapter} from './adapters/demo-adapter';
import {ChatUser, ChatUserStatus} from '../../projects/ng-talk/src/lib/models/chat-user';
import {NgTalkSettings} from '../../projects/ng-talk/src/lib/components/ng-talk-settings';
import {ChatAdapter} from '../../projects/ng-talk/src/lib/models/chat-adapter';
import {FormsModule} from "@angular/forms";
import {NgTalkChannelListComponent} from "../../projects/ng-talk/src/public_api";

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgTalkChannelListComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements OnInit {
  public demoAdapter = inject(DemoAdapter);

  public adapter: ChatAdapter;
  public chatSettings = new NgTalkSettings({
    showAvatars: true,
    selectFirstChannelOnInit: true,
    defaultAvatar: 'assets/unknown.png'
  });

  public user: ChatUser = {
    id: 100,
    name: 'George R. R. Martin',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Portrait_photoshoot_at_Worldcon_75%2C_Helsinki%2C_before_the_Hugo_Awards_%E2%80%93_George_R._R._Martin_%28cropped%29.jpg/220px-Portrait_photoshoot_at_Worldcon_75%2C_Helsinki%2C_before_the_Hugo_Awards_%E2%80%93_George_R._R._Martin_%28cropped%29.jpg',
    status: ChatUserStatus.Online
  };

  public ngOnInit() {
    this.adapter = this.demoAdapter;
    this.adapterChanged();
  }

  public adapterChanged() {
    // Not used
  }
}
