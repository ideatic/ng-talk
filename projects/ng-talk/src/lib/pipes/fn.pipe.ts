import {
  ChangeDetectorRef,
  EmbeddedViewRef,
  Inject,
  Pipe,
  PipeTransform
} from '@angular/core';

// https://stackoverflow.com/questions/67605122/obtain-a-slice-of-a-typescript-parameters-tuple
type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any
  ? R
  : never;

/**
 * Pipe que permite transformar un valor usando una función, recordando el resultado hasta que el valor cambie.
 *
 * Si se necesita indicar un contexto, se puede indicar como un array con el objeto y el nombre del método.
 *
 * Ejemplo: user | fn:[userSvc, 'get']
 *
 * https://dev.to/this-is-angular/deep-dive-into-angular-pipes-implementation-2g5n
 */
@Pipe({
  standalone: true,
  name: 'fn',
  pure: true
})
export class FnPipe implements PipeTransform {
  /**
   *@inject (ChangeDetectorRef) prevents:
   * NullInjectorError: No provider for EmbeddedViewRef!
   */
  constructor(
    // eslint-disable-next-line @angular-eslint/prefer-inject
    @Inject(ChangeDetectorRef)
    private readonly _viewRef: EmbeddedViewRef<unknown>
  ) {}

  public transform<T extends (...args: any) => any>(
    value: Parameters<T>[0],
    fn: T,
    ...args: [...ParametersExceptFirst<T>]
  ): ReturnType<T> {
    if (args.length) {
      args.unshift(value);
      return fn.apply(this._viewRef.context, args);
    } else {
      return fn.call(this._viewRef.context, value);
    }
  }
}
