import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import BudgetMainPage from "./BudgetMainPage";

// Firebase mocks
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
    collection: vi.fn((_, name) => {
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

// Child mocks
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

// TESTS
describe("BudgetMainPage", () => {
  it("shows Add Expense modal after selecting trip and currency", async () => {
    render(
      <BrowserRouter>
        <BudgetMainPage />
      </BrowserRouter>
    );

    // Open trip dropdown and select trip
    const tripDropdownButton = await screen.findByTestId("select-template");
    fireEvent.click(tripDropdownButton);
    const tripOption = await screen.findByText("Japan Trip");
    fireEvent.click(tripOption);

    // Open currency dropdown and select MYR
    const currencyDropdownButton = screen.getByTestId("select-currency");
    fireEvent.click(currencyDropdownButton);
    const currencyOption = await screen.findByText(/MYR — Malaysian Ringgit/i);
    fireEvent.click(currencyOption);

    // Click the Add Expense button
    const addButton = await screen.findByRole("button", {
      name: /\+ add expense/i,
    });
    fireEvent.click(addButton);

    // Modal should appear
    const modal = await screen.findByTestId("mock-expense-modal");
    expect(modal).toBeInTheDocument();
  });
});
