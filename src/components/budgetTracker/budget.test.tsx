import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import BudgetMainPage from "./BudgetMainPage";

vi.mock("../firebase", () => ({
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

const mockTemplatesQuery = {};
const mockExpensesQuery = {};

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
          pic: "test.jpg",
        }),
      })
    ),
    query: vi.fn((collectionRef) => {
      if (collectionRef === "mockTemplatesCollection")
        return mockTemplatesQuery;
      if (collectionRef === "mockExpensesCollection") return mockExpensesQuery;
      return {};
    }),
    where: vi.fn(),
    orderBy: vi.fn(),
    collection: vi.fn((db, name) => {
      if (name === "Templates") return "mockTemplatesCollection";
      if (name === "Expenses") return "mockExpensesCollection";
      return "mockCollection";
    }),
    onSnapshot: vi.fn((ref, callback) => {
      if (ref === mockTemplatesQuery) {
        callback({
          docs: [
            {
              id: "template1",
              data: () => ({ topic: "Japan Trip" }),
            },
          ],
        });
      } else if (ref === mockExpensesQuery) {
        callback({
          docs: [
            {
              id: "expense1",
              data: () => ({
                category: "food",
                currency: "MYR",
                date: "2024-06-28",
                description: "Dinner",
                totalSpending: 50,
                userId: "testUID",
                tripId: "template1",
              }),
            },
          ],
        });
      }
      return vi.fn();
    }),
  };
});

vi.mock("./DonutChart", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-donut-chart" />,
}));

vi.mock("./CurrencyConverter", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-currency-converter" />,
}));

vi.mock("./ExpenseModal", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="mock-expense-modal">
      <p>Mock Expense Modal</p>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe("BudgetMainPage", () => {
  it("renders trip options after auth and Firestore load", async () => {
    render(
      <BrowserRouter>
        <BudgetMainPage />
      </BrowserRouter>
    );

    const option = await screen.findByRole("option", { name: "Japan Trip" });
    expect(option).toBeInTheDocument();
  });

  it("shows Add Expense modal after selecting trip and clicking button", async () => {
    render(
      <BrowserRouter>
        <BudgetMainPage />
      </BrowserRouter>
    );

    const select = await screen.findByTestId("select");
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: "Japan Trip" })
      ).toBeInTheDocument()
    );

    fireEvent.change(select, { target: { value: "template1" } });
    await waitFor(() => expect(select).toHaveValue("template1"));

    const addButton = await screen.findByRole("button", {
      name: /\+ add expense/i,
    });
    fireEvent.click(addButton);

    const modal = await screen.findByTestId("mock-expense-modal");
    expect(modal).toBeInTheDocument();
  });
});
