import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'fn',
  pure: true
})
export class FnPipe implements PipeTransform {

  // A template syntax: {{ templateValue | fn:componentMethodRef:thisArg:fnArgument }}
  public transform<P, R>(value: P, fnReference: (arg: P, ...fnArguments: Array<any>) => R, context?: any, ...fnArguments: Array<any>): R {
    if (fnArguments.length) {
      fnArguments.unshift(value);
      return fnReference.apply(context, fnArguments);
    } else if (context) {
      return fnReference.call(context, value);
    } else {
      return fnReference(value);
    }
  }
}
