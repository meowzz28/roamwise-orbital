import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { toast } from "react-toastify";

vi.mock("../components/firebase", () => ({
  auth: {
    onAuthStateChanged: (cb: any) => {
      cb({ uid: "testUID" });
      return () => {};
    },
    currentUser: { uid: "testUID" },
  },
  db: {},
  storage: {}, // in case your code imports storage from here
}));

vi.mock("firebase/app", () => {
  return {
    initializeApp: vi.fn(),
    getApp: vi.fn(() => ({
      name: "[DEFAULT]",
      options: {},
    })),
  };
});

vi.mock("firebase/storage", () => {
  return {
    getStorage: vi.fn(() => ({})),
    ref: vi.fn(() => ({})),
    uploadBytes: vi.fn(() => Promise.resolve()),
    getDownloadURL: vi.fn(() =>
      Promise.resolve("https://fakeurl.com/image.jpg")
    ),
  };
});

const mockNavigate = vi.fn();
import CreatePost from "../components/Forum/createPost";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<any>("firebase/firestore");

  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({
          email: "test@test.com",
          firstName: "Test",
          lastName: "User",
          photo: "test.jpg",
        }),
      })
    ),
    getDocs: vi.fn(() =>
      Promise.resolve({
        docs: [
          {
            id: "template1",
            data: () => ({ topic: "Trip to Japan", userUIDs: ["testUID"] }),
          },
        ],
      })
    ),
    collection: vi.fn(),
    addDoc: vi.fn(() => Promise.resolve({})),
    serverTimestamp: vi.fn(() => "mockTimestamp"),
  };
});

vi.mock("react-toastify", async () => {
  const actual = await vi.importActual<any>("react-toastify");
  return {
    ...actual,
    toast: {
      error: vi.fn(),
      success: vi.fn(),
      loading: vi.fn(() => "loadingToastId"),
      update: vi.fn(),
    },
  };
});

describe("CreatePost", () => {
  it("prevents submission if required fields are empty", async () => {
    render(
      <BrowserRouter>
        <CreatePost />
      </BrowserRouter>
    );

    const topicInput = (await screen.findByPlaceholderText(
      /enter an interesting topic/i
    )) as HTMLTextAreaElement;
    const contentInput = screen.getByPlaceholderText(
      /share your thoughts/i
    ) as HTMLTextAreaElement;
    const submitButton = screen.getByRole("button", {
      name: /create post/i,
    }) as HTMLTextAreaElement;

    expect(topicInput).toHaveValue("");
    expect(contentInput).toHaveValue("");

    fireEvent.click(submitButton);

    expect(topicInput.checkValidity()).toBe(false);
    expect(contentInput.checkValidity()).toBe(false);
  });

  it("submits post when valid", async () => {
    render(
      <BrowserRouter>
        <CreatePost />
      </BrowserRouter>
    );

    fireEvent.change(
      await screen.findByPlaceholderText(/enter an interesting topic/i),
      {
        target: { value: "My First Post" },
      }
    );

    fireEvent.change(screen.getByPlaceholderText(/share your thoughts/i), {
      target: { value: "This is the content of my post." },
    });

    fireEvent.click(screen.getByRole("button", { name: /create post/i }));

    await waitFor(() => {
      expect(toast.update).toHaveBeenCalledWith(
        "loadingToastId",
        expect.anything()
      );

      expect(mockNavigate).toHaveBeenCalledWith("/forum");
    });
  });
});
