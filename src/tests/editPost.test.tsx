import {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { act } from "react";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
import EditPost from "../components/forum/editPost";

vi.mock("../components/firebase", () => ({
  auth: {
    onAuthStateChanged: (cb: any) => {
      cb({ uid: "testUID" });
      return () => {};
    },
    currentUser: { uid: "testUID" },
  },
  db: {},
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(() => Promise.resolve()),
  getDownloadURL: vi.fn(() => Promise.resolve("https://example.com/image.jpg")),
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<any>("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn((...args: string[]) => ({ path: args.join("/") })),

    getDoc: vi.fn((ref: any) =>
      Promise.resolve({
        exists: () => true,
        data: () => {
          if (ref.path.includes("Users")) {
            return {
              firstName: "TestUser",
              email: "test@test.com",
              photo: "",
            };
          }
          if (ref.path.includes("Forum/123")) {
            return {
              UID: "testUID",
              User: "TestUser",
              Topic: "Old Topic",
              Message: "Old Message",
              Likes: 0,
              LikedBy: [],
              TemplateID: "",
              imageUrls: [],
            };
          }
          return {};
        },
      })
    ),
    getDocs: vi.fn(() =>
      Promise.resolve({
        docs: [
          {
            id: "template1",
            data: () => ({
              topic: "Japan Trip",
              userUIDs: ["testUID"],
            }),
          },
        ],
      })
    ),
    updateDoc: vi.fn(() => Promise.resolve()),
    serverTimestamp: vi.fn(() => new Date()),
    collection: vi.fn(),
  };
});
vi.mock("react-toastify", () => ({
  toast: {
    error: vi.fn(),
    loading: vi.fn(() => "toast-id"),
    update: vi.fn(),
  },
}));

describe("EditPost Component", () => {
  it("Renders post data and submits updated content", async () => {
    mockNavigate.mockClear();
    render(
      <MemoryRouter initialEntries={["/editPost/123"]}>
        <Routes>
          <Route path="/editPost/:postId" element={<EditPost />} />
        </Routes>
      </MemoryRouter>
    );

    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading post...")
    );

    expect(screen.getByDisplayValue("Old Topic")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Old Message")).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Enter an interesting topic..."),
      {
        target: { value: "Updated Topic" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "Share your thoughts, questions, or ideas..."
      ),
      {
        target: { value: "Updated Message" },
      }
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /update post/i }));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/viewPost/123");
    });
  });
});
