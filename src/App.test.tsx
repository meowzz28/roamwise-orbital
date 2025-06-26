import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom"; // ✅ Needed for useNavigate
import App from "./App";

// Mock Firebase auth
vi.mock("./components/firebase", () => ({
  auth: {
    onAuthStateChanged: (callback: any) => {
      callback({ uid: "123" }); // simulate logged-in user
      return () => {}; // mock unsubscribe
    },
  },
}));

describe("App Component", () => {
  it("renders RoamWise after loading", async () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText("RoamWise").length).toBeGreaterThan(0);
    });
  });
});
