import React from "react";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

// Remotes are mocked here: gateway unit tests verify shell behavior
// (nav, routing, loading/error states) without depending on the remotes
// actually being served — that integration is covered separately, e.g.
// by running `npm run dev` and testing the composed app end-to-end.
jest.mock("./remotes/loaders", () => ({
  RemoteProductApp: () => <div data-testid="mock-product-remote">Product remote</div>,
  RemoteCartApp: () => <div data-testid="mock-cart-remote">Cart remote</div>,
  RemoteOrdersApp: () => <div data-testid="mock-orders-remote">Orders remote</div>,
}));

describe("Gateway App", () => {
  it("renders the shell and redirects / to /products", async () => {
    render(<App />);
    expect(screen.getByText("Final MFE Project")).toBeInTheDocument();
    expect(await screen.findByTestId("mock-product-remote")).toBeInTheDocument();
  });

  it("navigates to the Cart remote", async () => {
    render(<App />);
    screen.getByText("Cart").click();
    expect(await screen.findByTestId("mock-cart-remote")).toBeInTheDocument();
  });

  it("navigates to the Orders remote", async () => {
    render(<App />);
    screen.getByText("Orders").click();
    expect(await screen.findByTestId("mock-orders-remote")).toBeInTheDocument();
  });
});
