/** Retrospective. This is stupid, and I should just learn to love bitwise operations
 *
 * @deprecated
 */
export class BitFlags<FN extends number> {
  private bitmask: number;

  private constructor(...modifiers: FN[]) {
    this.bitmask = modifiers.reduce((mask, modifier) => mask | modifier, 0);
  }

  static FromFlags<F extends number>(...modifiers: Array<F>) {
    return new BitFlags<F>();
  }

  static FromBitmask<M extends number>(bitmask: number): BitFlags<M> {
    return new BitFlags<M>(...this.GetModifiersFromBitmask<M>(bitmask));
  }

  has(modifier: FN): boolean {
    return (this.bitmask & modifier) === modifier;
  }

  toBitmask(): number {
    return this.bitmask as number;
  }

  add(...modifiers: FN[]): BitFlags<FN> {
    const newBitmask = modifiers.reduce(
      (mask, modifier) => mask | modifier,
      this.bitmask
    );
    return new BitFlags(...BitFlags.GetModifiersFromBitmask(newBitmask));
  }

  remove(...modifiers: FN[]): BitFlags<FN> {
    const newBitmask = modifiers.reduce(
      (mask, modifier) => mask & ~modifier,
      this.bitmask
    );
    return new BitFlags(...BitFlags.GetModifiersFromBitmask(newBitmask));
  }

  private static GetModifiersFromBitmask<M extends number>(
    bitmask: number
  ): M[] {
    const modifiers: M[] = [];
    for (let i = 0; i < 32; i++) {
      const modifier = 1 << i;
      if ((bitmask & modifier) === modifier) {
        modifiers.push(modifier as M);
      }
    }
    return modifiers;
  }
}
