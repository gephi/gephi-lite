import { atom, derivedAtom } from "./atoms";

describe("Atoms library", () => {
  describe("atom#bind, atom#unbind", () => {
    it("should work as expected", () => {
      let newValue = 0;
      const handler = (v: number) => {
        newValue = v;
      };

      const numberAtom = atom(newValue);
      numberAtom.bind(handler);
      numberAtom.set(42);
      expect(newValue).toBe(42);

      numberAtom.unbind(handler);
      numberAtom.set(123);
      expect(newValue).toBe(42);
    });

    it("should not trigger bound functions when new value is same as current value", () => {
      let count = 0;
      const handler = () => {
        count++;
      };

      const numberAtom = atom(0);
      numberAtom.bind(handler);
      numberAtom.set(42);
      numberAtom.set(42);
      expect(count).toBe(1);
    });
  });

  describe("#derivedAtom", () => {
    it("should be updated when dependencies are updated", () => {
      const a1 = atom(0);
      const a2 = atom(0);
      const sum = derivedAtom([a1, a2], (v1, v2, _previousValue) => v1 + v2);
      expect(sum.get()).toBe(0);

      a1.set(123);
      expect(sum.get()).toBe(123);

      a2.set(42);
      expect(sum.get()).toBe(123 + 42);
    });

    it("should not trigger bound functions when new value is same as current value", () => {
      const a = atom(0);
      const aSquare = derivedAtom(a, (v) => v * v);
      const sum = derivedAtom([a, aSquare], (v, vSquare) => v + vSquare);

      let count = 0;
      sum.bind(() => count++);

      a.set(2);
      expect(sum.get()).toBe(6);
      expect(count).toBe(1);
    });
  });
});
