import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { act } from "react";
import Forum from "./forum";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: actual.BrowserRouter,
  };
});

vi.mock("../firebase", () => ({
  auth: {
    onAuthStateChanged: (cb: any) => {
      cb({ uid: "testUID" });
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
        data: () => ({
          firstName: "Test",
          email: "test@test.com",
          pic: "",
        }),
      })
    ),
    getDocs: vi.fn(() =>
      Promise.resolve({
        docs: [
          {
            id: "1",
            data: () => ({
              User: "TestUser",
              Topic: "Less Liked Topic",
              Likes: 5,
              Message: "Test Message",
              Time: { seconds: Date.now() / 1000 },
            }),
          },
          {
            id: "2",
            data: () => ({
              User: "UserB",
              Topic: "More Liked Topic",
              Likes: 10,
              Message: "Message B",
              Time: { seconds: Date.now() / 1000 - 10 }, // earlier time
            }),
          },
        ],
      })
    ),
    collection: vi.fn(),
  };
});

describe("Forum Component", () => {
  it("Renders and shows forum posts", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Forum />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("More Liked Topic")).toBeInTheDocument();
      expect(screen.getByText("TestUser")).toBeInTheDocument();
    });
  });

  it("Sorts posts by likes when filter is set to 'Most Liked'", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Forum />
        </BrowserRouter>
      );
    });

    const filterSelect = screen.getByLabelText(/Filter by/i);

    await act(async () => {
      const select = filterSelect as HTMLSelectElement;
      select.value = "likes";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const rows = screen.getAllByRole("row");

    const firstPostRow = rows[1];
    const secondPostRow = rows[2];

    expect(firstPostRow).toHaveTextContent("More Liked Topic");
    expect(secondPostRow).toHaveTextContent("Less Liked Topic");
  });

  it("Filters posts based on search input", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Forum />
        </BrowserRouter>
      );
    });

    const searchInput = screen.getByPlaceholderText("Search by topic...");

    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "More" } });
    });

    await waitFor(() => {
      expect(screen.getByText("More Liked Topic")).toBeInTheDocument();
      expect(screen.queryByText("Less Liked Topic")).not.toBeInTheDocument();
    });
  });

  it("Navigates to ViewPost when a post is clicked", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Forum />
        </BrowserRouter>
      );
    });

    const postToClick = await screen.findByText("More Liked Topic");

    await act(async () => {
      fireEvent.click(postToClick);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/viewPost/2");
    });
  });
});
