import {Component} from '@angular/core';

@Component({
  selector: 'ng-talk-channel-message-writing',
  standalone: true,
  template: `
    <span></span>
    <span></span>
    <span></span>
  `,
  // https://codepen.io/jordanlove/pen/NjOvLv
  styles: [`
    :host {
      display: block;
      text-align: center;
    }

    span {
      display: inline-block;
      background-color: #B6B5BA;
      width: 15px;
      height: 15px;
      border-radius: 100%;
      margin-right: 5px;
      animation: bubbles 2s infinite;
    }

    span:nth-child(1) {
      animation-delay: -1s;
    }

    span:nth-child(2) {
      animation-delay: -0.85s;
    }

    span:nth-child(3) {
      animation-delay: -0.7s;
      margin-right: 0;
    }

    @keyframes bubbles {
      10% {
        transform: translateY(-10px);
        background-color: #9E9DA2;
      }
      50% {
        transform: translateY(0);
        background-color: #B6B5BA;
      }
    }
  `]
})
export class NgTalkChannelMessageWritingComponent {

}
