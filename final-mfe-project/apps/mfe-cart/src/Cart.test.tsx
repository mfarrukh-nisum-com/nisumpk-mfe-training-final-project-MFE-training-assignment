import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { Cart } from "./Cart";
import { useAppStore } from "@final-mfe/state";
import { NISUM } from "@final-mfe/events";
import * as api from "./api";

jest.mock("./api");

describe("Cart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({ cart: { items: [], totalItems: 0, totalPrice: 0 }, user: null });
  });

  it("renders items already present in shared state", () => {
    useAppStore.setState({
      cart: {
        items: [{ productId: "p1", name: "Keyboard", price: 100, quantity: 1 }],
        totalItems: 1,
        totalPrice: 100,
      },
      user: null,
    });
    render(<Cart />);
    expect(screen.getByText(/Keyboard/)).toBeInTheDocument();
  });

  it("reacts to a cart:item-added event received from another MFE", () => {
    render(<Cart />);
    act(() => {
      NISUM.emit("cart:item-added", { productId: "p1", quantity: 1 });
    });
    expect(screen.getByText(/item added/i)).toBeInTheDocument();
  });

  it("removes an item, emits cart:item-removed, and syncs the backend", async () => {
    (api.removeFromCartApi as jest.Mock).mockResolvedValue(undefined);
    useAppStore.setState({
      cart: {
        items: [{ productId: "p1", name: "Keyboard", price: 100, quantity: 1 }],
        totalItems: 1,
        totalPrice: 100,
      },
      user: null,
    });
    const handler = jest.fn();
    NISUM.listener("cart:item-removed", handler);

    render(<Cart />);
    screen.getByText("Remove").click();

    expect(handler).toHaveBeenCalledWith({ productId: "p1" });
    expect(useAppStore.getState().cart.items).toHaveLength(0);
    await waitFor(() => expect(api.removeFromCartApi).toHaveBeenCalledWith("p1"));
  });

  it("checks out: calls the backend, clears the cart, and emits order:created", async () => {
    (api.checkout as jest.Mock).mockResolvedValue({
      id: "ord_1",
      items: [],
      total: 100,
      createdAt: new Date().toISOString(),
    });
    useAppStore.setState({
      cart: {
        items: [{ productId: "p1", name: "Keyboard", price: 100, quantity: 1 }],
        totalItems: 1,
        totalPrice: 100,
      },
      user: null,
    });
    const handler = jest.fn();
    NISUM.listener("order:created", handler);

    render(<Cart />);
    screen.getByText("Checkout").click();

    await waitFor(() => expect(handler).toHaveBeenCalledWith({ orderId: "ord_1", total: 100 }));
    expect(useAppStore.getState().cart.items).toHaveLength(0);
  });

  it("shows a retry-able error if checkout fails", async () => {
    (api.checkout as jest.Mock).mockRejectedValue(new Error("Cannot checkout an empty cart"));
    useAppStore.setState({
      cart: {
        items: [{ productId: "p1", name: "Keyboard", price: 100, quantity: 1 }],
        totalItems: 1,
        totalPrice: 100,
      },
      user: null,
    });

    render(<Cart />);
    screen.getByText("Checkout").click();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
