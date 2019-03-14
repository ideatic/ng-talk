export const nameof = <T>(name: keyof T) => name;

export function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

export function daysDiff(date: Date, reference: Date): number {
    const diff = new Date(date.getTime()).setHours(12) - new Date(reference.getTime()).setHours(12);
    return Math.round(diff / 8.64e7);
}

export function bindEvent(element: HTMLElement | Window | Document, events: string, handle: EventListener, extra?: any): () => void {
    const eventTypes = events.indexOf(' ') >= 0 ? events.split(' ') : [events];
    let i = eventTypes.length;

    while (i--) {
        element.addEventListener(eventTypes[i], handle, extra);
    }

    // Return function to remove listeners
    return () => {
        for (const event of eventTypes) {
            element.removeEventListener(event, handle);
        }
    };
}