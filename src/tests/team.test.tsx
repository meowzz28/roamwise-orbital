import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { act } from "react";
import Team from "../components/team/index";
import { addDoc } from "firebase/firestore";

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
            id: "team1",
            data: () => ({
              Name: "Alpha Team",
              admin: ["testUID"],
              admin_name: ["Test"],
              user_email: ["test@test.com"],
              user_uid: ["testUID"],
              user_name: ["Test"],
            }),
          },
        ],
      })
    ),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    collection: vi.fn(() => "mockCollectionRef"),
    addDoc: vi.fn(() =>
      Promise.resolve({
        id: "mockTeamId123",
      })
    ),
  };
});

describe("Team Component", () => {
  it("Renders the team list", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Team />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Alpha Team")).toBeInTheDocument();
    });
  });

  it("Shows modal when clicking 'Form New Team'", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Team />
        </BrowserRouter>
      );
    });

    const createButton = screen.getByText("Form New Group");
    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(
        screen.getAllByText("Create New Team").length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it("Creates a new team through modal", async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <Team />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Groups 👥")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Form New Group"));

    const input = screen.getByPlaceholderText("eg. Team Japan");
    fireEvent.change(input, { target: { value: "Team Rocket" } });

    const buttons = screen.getAllByText("Create New Team");
    fireEvent.click(buttons[1]);

    expect(addDoc).toHaveBeenCalledWith(
      "mockCollectionRef",
      expect.objectContaining({
        Name: "Team Rocket",
        admin: ["testUID"],
        admin_name: ["Test"],
        user_uid: ["testUID"],
        user_email: ["test@test.com"],
        user_name: ["Test"],
        created_by: "testUID",
      })
    );

    await waitFor(() => {
      expect(screen.getByText("Team Rocket")).toBeInTheDocument();
    });
  });
});
