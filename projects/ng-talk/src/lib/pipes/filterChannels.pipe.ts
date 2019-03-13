import {Pipe, PipeTransform} from '@angular/core';
import {ChatChannel} from "../models/chat-channel";

@Pipe({name: 'filterChannels'})
export class FilterChannelsPipe implements PipeTransform {

    public transform(channels: ChatChannel[], query: string): ChatChannel[] {
        if (!query) {
            return channels;
        }
        return channels.filter(c => c.name.toLocaleLowerCase().indexOf(query) >= 0);
    }
}
