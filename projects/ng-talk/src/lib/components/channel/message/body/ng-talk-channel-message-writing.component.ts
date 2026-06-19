import { Component } from '@angular/core';

@Component({
  selector: 'ng-talk-channel-message-writing',
  template: `
    <span></span>
    <span></span>
    <span></span>
  `,
  // https://codepen.io/jordanlove/pen/NjOvLv
  styles: `
    :host {
      display: block;
      text-align: center;
    }

    span {
      display: inline-block;
      animation: bubbles 2s infinite;
      margin-right: 5px;
      border-radius: 100%;
      background-color: #b6b5ba;
      width: 15px;
      height: 15px;
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
        background-color: #9e9da2;
      }
      50% {
        transform: translateY(0);
        background-color: #b6b5ba;
      }
    }
  `
})
export class NgTalkChannelMessageWritingComponent {}
