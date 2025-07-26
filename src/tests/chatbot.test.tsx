import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatBot from "../components/Chatbot/chatbot";
import { vi } from "vitest";

vi.mock("../components/firebase", () => ({
  auth: { currentUser: { uid: "test-user" } },
  db: {},
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    doc: vi.fn(() => ({})),
  };
});

vi.mock("../../hooks/useAIResponse", () => ({
  default: () => ({
    sendToAI: vi.fn(() =>
      Promise.resolve({
        success: true,
        reply: "AI reply!",
      })
    ),
    typing: false,
    error: null,
  }),
}));

describe("ChatBot", () => {
  it("shows message when no chat is selected", () => {
    render(<ChatBot selectedChatID={null} />);
    expect(screen.getByText(/select or create a chat/i)).toBeInTheDocument();
  });

  it("shows loading state when fetching messages", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as any).mockImplementation(
      () => new Promise(() => {}) // simulate loading
    );

    render(<ChatBot selectedChatID="123" />);
    expect(screen.getByText(/loading chat/i)).toBeInTheDocument();
  });

  it("loads and displays messages", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({
        messages: [
          { message: "Hello", sender: "user", direction: "outgoing" },
          { message: "Hi there!", sender: "assistant", direction: "incoming" },
        ],
      }),
    });

    render(<ChatBot selectedChatID="123" />);
    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(screen.getByText("Hi there!")).toBeInTheDocument();
    });
  });

  it("renders user and AI messages", async () => {
    const { getDoc } = await import("firebase/firestore");
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({
        messages: [
          {
            message: "Where should I go?",
            sender: "user",
            direction: "outgoing",
          },
          { message: "AI reply!", sender: "assistant", direction: "incoming" },
        ],
      }),
    });

    render(<ChatBot selectedChatID="123" />);

    await waitFor(() => {
      expect(screen.getByText("Where should I go?")).toBeInTheDocument();
      expect(screen.getByText("AI reply!")).toBeInTheDocument();
    });
  });
});
