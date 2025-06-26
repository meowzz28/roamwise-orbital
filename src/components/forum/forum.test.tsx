import { render, screen, waitFor } from "@testing-library/react";
import Forum from "./forum";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

// Firebase mocks
vi.mock("../firebase", () => ({
  auth: {
    onAuthStateChanged: (cb: any) => {
      cb({ uid: "testUID" }); // Mock user
      return () => {};
    },
    currentUser: { uid: "testUID" },
  },
  db: {},
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<any>("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({ firstName: "Test", email: "test@test.com", pic: "" }),
      })
    ),
    getDocs: vi.fn(() =>
      Promise.resolve({
        docs: [
          {
            id: "1",
            data: () => ({
              User: "TestUser",
              Topic: "Test Topic",
              Likes: 5,
              Message: "Test Message",
              Time: { seconds: Date.now() / 1000 },
            }),
          },
        ],
      })
    ),
    collection: vi.fn(),
  };
});

// Mock react-toastify to prevent actual toast display
vi.mock("react-toastify", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("Forum Component", () => {
  it("renders and shows posts", async () => {
    render(
      <BrowserRouter>
        <Forum />
      </BrowserRouter>
    );

    // Wait for loading to finish and check if topic appears
    await waitFor(() => {
      expect(screen.getByText("Test Topic")).toBeInTheDocument();
      expect(screen.getByText("TestUser")).toBeInTheDocument();
    });
  });

  it("shows loading initially", () => {
    render(
      <BrowserRouter>
        <Forum />
      </BrowserRouter>
    );

    expect(screen.getAllByText("Loading...").length).toBeGreaterThan(0);
  });
});
