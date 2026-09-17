import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ProductList } from "./ProductList";
import * as api from "./api";
import { NISUM } from "@final-mfe/events";

jest.mock("./api");

const mockProducts = [
  { id: "p1", name: "Keyboard", description: "clicky", price: 100, imageUrl: "", inStock: true },
];

describe("ProductList", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders products returned by the API", async () => {
    (api.fetchProducts as jest.Mock).mockResolvedValue(mockProducts);
    render(<ProductList />);
    await waitFor(() => expect(screen.getByText("Keyboard")).toBeInTheDocument());
  });

  it("shows an error state and allows retry when the API fails", async () => {
    (api.fetchProducts as jest.Mock).mockRejectedValueOnce(new Error("Network error"));
    render(<ProductList />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    (api.fetchProducts as jest.Mock).mockResolvedValueOnce(mockProducts);
    fireEvent.click(screen.getByText(/try again/i));
    await waitFor(() => expect(screen.getByText("Keyboard")).toBeInTheDocument());
  });

  it("emits cart:item-added on the NISUM bus when 'Add to cart' is clicked", async () => {
    (api.fetchProducts as jest.Mock).mockResolvedValue(mockProducts);
    (api.addToCartApi as jest.Mock).mockResolvedValue(undefined);
    const handler = jest.fn();
    NISUM.listener("cart:item-added", handler);

    render(<ProductList />);
    await waitFor(() => screen.getByText("Keyboard"));
    fireEvent.click(screen.getByText(/add to cart/i));

    expect(handler).toHaveBeenCalledWith({ productId: "p1", quantity: 1 });
  });

  it("persists the add-to-cart to the backend via addToCartApi", async () => {
    (api.fetchProducts as jest.Mock).mockResolvedValue(mockProducts);
    (api.addToCartApi as jest.Mock).mockResolvedValue(undefined);

    render(<ProductList />);
    await waitFor(() => screen.getByText("Keyboard"));
    fireEvent.click(screen.getByText(/add to cart/i));

    await waitFor(() => expect(api.addToCartApi).toHaveBeenCalledWith("p1", 1));
  });

  it("shows a notification if the backend cart save fails, without crashing", async () => {
    (api.fetchProducts as jest.Mock).mockResolvedValue(mockProducts);
    (api.addToCartApi as jest.Mock).mockRejectedValue(new Error("Server down"));
    const handler = jest.fn();
    NISUM.listener("notification:show", handler);

    render(<ProductList />);
    await waitFor(() => screen.getByText("Keyboard"));
    fireEvent.click(screen.getByText(/add to cart/i));

    await waitFor(() =>
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ level: "error" }))
    );
  });
});
