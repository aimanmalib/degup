// Pemancar SATU pendengar dikongsi sumber sim dan replay (metrik, petunjuk): sama seperti SDK, pendengar baharu menggantikan yang lama.
export class Pemancar<A extends unknown[]> {
  private f: ((...a: A) => void) | null = null;

  /** Daftar SATU pendengar; pulang fungsi nyahdaftar. */
  dengar = (f: (...a: A) => void): (() => void) => {
    this.f = f;
    return () => {
      if (this.f === f) this.f = null;
    };
  };

  pancar(...a: A): void {
    this.f?.(...a);
  }
}
