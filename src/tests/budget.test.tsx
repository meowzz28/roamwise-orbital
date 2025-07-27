import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import BudgetMainPage from "../components/BudgetTracker/budgetMainPage";

// Firebase mocks
vi.mock("../components/firebase", () => ({
  default: {},
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

vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})), // return dummy functions instance
  httpsCallable: vi.fn(() => vi.fn(() => Promise.resolve({ data: {} }))), // mock the callable function
}));

const mockTemplatesQuery = "mockTemplatesCollection";
const mockExpensesQuery = "mockExpensesCollection";

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
    query: vi.fn((collectionRef) => collectionRef),
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
vi.mock("../components/BudgetTracker/donutChart", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-donut-chart" />,
}));

vi.mock("./currencyConverter", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-currency-converter" />,
}));

vi.mock("../components/BudgetTracker/expenseModal", () => ({
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
    await waitFor(() => {
      expect(screen.getByTestId("mock-expense-modal")).toBeInTheDocument();
    });
  });
});
