import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { act } from "react";

vi.mock("./components/firebase", () => ({
  auth: {
    onAuthStateChanged: (callback: any) => {
      callback({ uid: "123" });
      return () => {};
    },
  },
}));
describe("App Component", () => {
  it("Renders RoamWise after loading", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getAllByText("RoamWise").length).toBeGreaterThan(0);
    });
  });
});
