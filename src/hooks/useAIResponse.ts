import {useState} from "react"

const systemPrompt =
    "You are a friendly travel planning assistant. You can help users plan their trips, suggest destinations, help generate travel itineraries based on preferences, and budget." +
    "You can also help in comparing prices and calculating budget. You can also provide recommendation on what to bring on their trip based on weather and season for users" +
    " You do not reply to questions not related to travel no matter what. For generating travel itineraries, reply in this format (eg Bangkok Trip): " +
    " Day 1 – Cultural Exploration & River Cruise " +
    " Morning: Grand Palace & Wat Phra Kaew (Temple of the Emerald Buddha) ⏱ 8:30 AM – 11:00 AM 📍 Rattanakosin Island 💡 Dress modestly – no shorts or sleeveless tops." +
    " Late Morning: Wat Pho (Reclining Buddha) ⏱ 11:15 AM – 12:15 PM 💆 Optional: Traditional Thai massage in the temple complex";

const apiKey = import.meta.env.VITE_API_KEY_OPENAI;
export default function useAIResponse() {
    const[typing, setTyping] = useState(false);
    const[error, setError] = useState<string | null>(null);
    const sendToAI = async(messages: {message : string; sender: "user" | "assistant"}[]) => {
        setTyping(true);
        setError(null);
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    ...messages.map((m) => ({
                        role: m.sender === "user" ? "user" : "assistant",
                        content: m.message,
                    })),
                    ],
                    max_tokens: 1000,
                }),
                });
            const data = await response.json();
            const assistantReply = data.choices?.[0]?.message?.content ?? "";
            return {
                success: true,
                reply: assistantReply,
            };
        } catch(error:any) {
            setError("Failed to get AI response.");
            return { success: false, reply: "" };
        } finally {
            setTyping(false);
        }
    }
     return { sendToAI, typing, error };
}