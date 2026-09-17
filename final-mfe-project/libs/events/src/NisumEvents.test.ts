import { NisumEventBus } from "./NisumEvents";

describe("NisumEventBus", () => {
  let bus: NisumEventBus;

  beforeEach(() => {
    bus = new NisumEventBus(new EventTarget());
  });

  it("delivers the payload to a registered listener", () => {
    const handler = jest.fn();
    bus.listener("cart:item-added", handler);

    bus.emit("cart:item-added", { productId: "p1", quantity: 2 });

    expect(handler).toHaveBeenCalledWith({ productId: "p1", quantity: 2 });
  });

  it("supports multiple listeners for the same event", () => {
    const a = jest.fn();
    const b = jest.fn();
    bus.listener("cart:item-added", a);
    bus.listener("cart:item-added", b);

    bus.emit("cart:item-added", { productId: "p1", quantity: 1 });

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("stops delivering events after unsubscribe", () => {
    const handler = jest.fn();
    const unsubscribe = bus.listener("cart:item-removed", handler);

    unsubscribe();
    bus.emit("cart:item-removed", { productId: "p1" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not call a handler for a different event name", () => {
    const handler = jest.fn();
    bus.listener("cart:item-added", handler);

    bus.emit("cart:item-removed", { productId: "p1" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("once() only fires a single time then auto-unsubscribes", () => {
    const handler = jest.fn();
    bus.once("notification:show", handler);

    bus.emit("notification:show", { message: "first", level: "info" });
    bus.emit("notification:show", { message: "second", level: "info" });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ message: "first", level: "info" });
  });
});
