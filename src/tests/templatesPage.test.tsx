import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import TemplatesPage from "../components/template/templatesPage";
import { act } from "@testing-library/react";
import { addDoc } from "firebase/firestore";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../components/firebase", () => ({
  auth: {
    onAuthStateChanged: (cb: any) => {
      cb({ uid: "testUID" });
      return () => {};
    },
    currentUser: { uid: "testUID" },
  },
  db: {},
  storage: {},
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<any>("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn((ref: any) =>
      Promise.resolve({
        exists: () => true,
        data: () => ({
          firstName: "TestUser",
          email: "test@test.com",
          pic: "",
          Name: "Test Team",
          user_email: ["test@test.com"],
          user_uid: ["testUID"],
          user_name: ["TestUser"],
        }),
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
              userEmails: ["test@test.com"],
              users: ["TestUser"],
              startDate: "2023-01-01",
              endDate: "2023-01-10",
              imageURL: "",
              time: { seconds: 1, nanoseconds: 0 },
            }),
          },
        ],
      })
    ),
    collection: vi.fn(() => "mockCollectionRef"),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn((query, cb) => {
      cb({
        docs: [
          {
            id: "team1",
            data: () => ({
              Name: "Test Team",
              admin: ["testUID"],
              admin_name: ["TestUser"],
              user_email: ["test@test.com"],
              user_uid: ["testUID"],
              user_name: ["TestUser"],
            }),
          },
        ],
      });
      return () => {};
    }),
    addDoc: vi.fn(() =>
      Promise.resolve({
        id: "mockTeamId123",
      })
    ),
    serverTimestamp: vi.fn(() => new Date()),
  };
});

describe("TemplatesPage Component", () => {
  it("Renders templates and shows create button", async () => {
    render(
      <BrowserRouter>
        <TemplatesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Japan Trip")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /create new trip/i })
    ).toBeInTheDocument();
  });

  it("Shows modal when clicking 'Create New Trip'", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <TemplatesPage />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Japan Trip")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create New Trip +"));

    await waitFor(() => {
      expect(screen.getByText("Template Name")).toBeInTheDocument();
    });
  });

  it("Creates a new team through modal", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <TemplatesPage />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Japan Trip")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Create New Trip +"));

    const input = await screen.findByPlaceholderText("e.g. Japan Trip");
    fireEvent.change(input, { target: { value: "Team Rocket" } });

    const startInput = screen.getByLabelText("Start Date");
    fireEvent.change(startInput, { target: { value: "2025-07-01" } });

    const endInput = screen.getByLabelText("End Date");
    fireEvent.change(endInput, { target: { value: "2025-07-05" } });

    const createBtn = screen.getByTestId("create-template-btn");
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith(
        "mockCollectionRef",
        expect.objectContaining({
          topic: "Team Rocket",
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Team Rocket")).toBeInTheDocument();
    });
  });
});
