import { atom } from "./atoms";
import { producerToAction } from "./producers";

describe("Producers library", () => {
  describe("#producerToAction", () => {
    const a = atom(0);
    const producer = (v: number) => (currentValue: number) => currentValue + v;

    const action = producerToAction(producer, a);
    let count = 0;
    a.bind(() => count++);

    it("should work as expected", () => {
      action(12);
      expect(a.get()).toBe(12);
      expect(count).toBe(1);
    });

    it("should only trigger when new value differs from current one", () => {
      action(0);
      expect(a.get()).toBe(12);
      expect(count).toBe(1);
    });
  });
});
