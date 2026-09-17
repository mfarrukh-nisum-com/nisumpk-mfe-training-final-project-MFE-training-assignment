import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { OrdersList } from "./OrdersList";
import * as api from "./api";
import { NISUM } from "@final-mfe/events";

jest.mock("./api");

const mockOrder = {
  id: "ord_1",
  items: [{ productId: "p1", name: "Keyboard", price: 100, quantity: 1 }],
  total: 100,
  createdAt: new Date().toISOString(),
};

describe("OrdersList", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows an empty state when there are no orders yet", async () => {
    (api.fetchOrders as jest.Mock).mockResolvedValue([]);
    render(<OrdersList />);
    await waitFor(() => expect(screen.getByText(/no orders yet/i)).toBeInTheDocument());
  });

  it("renders orders returned by the API", async () => {
    (api.fetchOrders as jest.Mock).mockResolvedValue([mockOrder]);
    render(<OrdersList />);
    await waitFor(() => expect(screen.getByText("ord_1")).toBeInTheDocument());
  });

  it("shows an error state with retry", async () => {
    (api.fetchOrders as jest.Mock).mockRejectedValueOnce(new Error("Network error"));
    render(<OrdersList />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    (api.fetchOrders as jest.Mock).mockResolvedValueOnce([mockOrder]);
    screen.getByText(/try again/i).click();
    await waitFor(() => expect(screen.getByText("ord_1")).toBeInTheDocument());
  });

  it("refetches when it receives an order:created event from another MFE", async () => {
    (api.fetchOrders as jest.Mock).mockResolvedValue([]);
    render(<OrdersList />);
    await waitFor(() => screen.getByText(/no orders yet/i));

    (api.fetchOrders as jest.Mock).mockResolvedValueOnce([mockOrder]);
    act(() => {
      NISUM.emit("order:created", { orderId: "ord_1", total: 100 });
    });

    await waitFor(() => expect(screen.getByText("ord_1")).toBeInTheDocument());
    expect(api.fetchOrders).toHaveBeenCalledTimes(2); // initial load + event-triggered reload
  });
});
