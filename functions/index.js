import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import admin from 'firebase-admin';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import vision from '@google-cloud/vision';

dotenv.config();
admin.initializeApp();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const visionClient = new vision.ImageAnnotatorClient();

export const parseReceiptWithAI = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    console.log("Authenticated user:", request.auth.uid);

    const { base64Image } = request.data;

    if (!base64Image) {
      throw new HttpsError('invalid-argument', 'No image provided.');
    }

    let ocrText = '';
    
    try {
      const [result] = await visionClient.textDetection({
        image: { content: base64Image },
      });

      if (result.textAnnotations && result.textAnnotations.length > 0) {
        ocrText = result.textAnnotations[0].description || '';
      } else if (result.fullTextAnnotation) {
        ocrText = result.fullTextAnnotation.text || '';
      } else {
        throw new Error('No text detected in image');
      }

      logger.info("OCR extraction successful");
      logger.info("OCR Text length:", ocrText.length);
      logger.info("OCR Text preview:", ocrText.substring(0, 200) + '...');
      
    } catch (visionError) {
      logger.error('Vision API error:', visionError);
      throw new HttpsError('internal', 'Failed to extract text from image');
    }

    if (!ocrText || typeof ocrText !== 'string' || !ocrText.trim()) {
      throw new HttpsError('invalid-argument', 'OCR failed to detect any readable text.');
    }

    const cleanedOcrText = ocrText.trim().replace(/\0/g, ''); 
    
    if (cleanedOcrText.length === 0) {
      throw new HttpsError('invalid-argument', 'OCR text is empty after cleaning.');
    }

    const gptPrompt = `
You are a receipt parsing expert. Given raw OCR text from a receipt, extract this structured information:

{
  "vendor": string,
  "date": "YYYY-MM-DD",
  "amount": number,
  "currency": string,
  "category":string,
  "items": [
    { "name": string, "price": number }
  ]
}

Notes:
- "amount" is the total expense.
- "currency" is the 3-letter code (e.g. "USD", "SGD", "MYR").
- There may be multiple languages on the receipt.
- If information is missing or uncertain, make your best guess.
- Return only valid JSON, no markdown formatting.
-category includes only accommodation, transport, food and others

Here is the receipt OCR text:
---
${cleanedOcrText}
---

Return only raw JSON. Do NOT wrap the response in markdown (no \`\`\`\` or formatting).`;

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You extract structured receipt data from OCR text. Return only valid JSON.' },
          { role: 'user', content: gptPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      });
    } catch (openaiError) {
      logger.error('OpenAI API error:', openaiError);
      throw new HttpsError('internal', 'Failed to process receipt with AI');
    }

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new HttpsError('internal', 'No response from AI service');
    }

    logger.info('GPT Response:', responseText);

    let parsedResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }
      const jsonString = jsonMatch[0];
      parsedResult = JSON.parse(jsonString);
      
      if (!parsedResult.vendor || !parsedResult.amount || !parsedResult.currency) {
        throw new Error('Invalid JSON structure from AI response');
      }
      
    } catch (parseError) {
      logger.error('JSON parsing error:', parseError);
      logger.error('Raw response:', responseText);
      throw new HttpsError('internal', 'Failed to parse AI response');
    }

    return parsedResult;
    
  } catch (err) {
    logger.error('Receipt parsing error:', err);
    
    if (err instanceof HttpsError) {
      throw err;
    }
    
    throw new HttpsError('internal', 'Failed to parse receipt.');
  }
});

//Estimate Budget
export const estimateBudget = onCall(  async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { templateData, preferences } = request.data;

    if (!templateData) {
      throw new HttpsError('invalid-argument', 'Missing template data');
    }

    const templateRef = admin.firestore().collection('Templates').doc(templateData.templateId);
    const templateDoc = await templateRef.get();

    if (!templateDoc.exists) {
      throw new HttpsError('not-found', 'Template not found');
    }

    const template = templateDoc.data();

    if (!template.userUIDs?.includes(request.auth.uid)) {
      throw new HttpsError('permission-denied', 'Not authorized to access this template');
    }

    const dailyPlansSnapshot = await templateRef.collection('DailyPlans').get();
    
    const processedDailyPlans = dailyPlansSnapshot.docs.map((doc) => {
      const text = doc.data().text || '';
      const activities = extractActivitiesFromText(text);

      logger.info(`Processed Day ${doc.id}:`, activities); 

      return {
        date: doc.id,
        text,
        activities,
      };
    });

    const prompt = createBudgetPrompt(templateData, processedDailyPlans, preferences);
    logger.info('Final AI prompt:', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
         content: 'You are a travel budget estimation expert. Respond only with valid JSON that matches the required format. Do not include any additional explanation or text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,

    });

    const rawContent = completion.choices[0].message.content;
    logger.info('Raw OpenAI response:', rawContent);

    const budgetData = extractJsonFromResponse(rawContent);

    const budgetRef = admin.firestore().collection('BudgetEstimates').doc(templateData.templateId);

    await budgetRef.set({
      ...budgetData,
      templateId: templateData.templateId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
      preferences: preferences || {},
    });

    return budgetData;
  } catch (error) {
    logger.error('Budget estimation error:', error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to estimate budget');
  }
});

//Helper Functions 

function extractActivitiesFromText(text) {
  if (!text.trim()) return [];

  return text
    .split(/[\n\r•\-\*]/) 
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length < 150);
}

function createBudgetPrompt(templateData, dailyPlans, preferences) {
  const {
    topic,
    startDate,
    endDate,
    users,
  } = templateData;

  const budgetLevel = preferences?.budgetLevel || 'mid-range';
  const groupSize = users?.length || 1;
  const homeCountry = preferences?.homeCountry || 'Singapore';
  const currency = preferences?.currency || 'SGD';

  const dailyPlansText = dailyPlans.map((plan) => {
    const activities = plan.text
      ? plan.text.substring(0, 1000) 
      : 'No specific activities planned';

    return `Day ${plan.date}: ${activities}`;
  }).join('\n');

  return `
Estimate a realistic travel budget for the following trip:

**Trip Details:**
- Destination/Topic: ${topic}
- Duration: ${startDate} to ${endDate}
- Group Size: ${groupSize} people
- Budget Level: ${budgetLevel}
- Preferred Currency: ${currency}
- Include estimated round-trip flights from ${homeCountry}. If no flight is necessary (e.g. the destination is local or nearby), set "flights" to 0 in the breakdown.

**Daily Plans:**
${dailyPlansText}

**Requirements:**
- Provide budget per person in ${currency}
- Include accommodation, food, activities, transportation, miscellaneous, and flights
- Give daily breakdown and total estimate
- Consider ${budgetLevel} budget level (budget/mid-range/luxury)
- Base estimates on the planned activities for each day
- Also consider the date of the trip since prices vary depending on seasons (prices higher during peak seasons)
- If no specific activities are mentioned, provide general estimates for typical tourist activities
- Include a daily breakdown, with realistic cost variation, depending on the daily activites on each day
- Include estimated round-trip flights from ${homeCountry}. If no flight is necessary (e.g. the destination is local or nearby), set "flights" to 0 in the breakdown.
- Flights should **not** appear in daily breakdown, only in the overall breakdown.

**Response Format (JSON only):**
{
  "totalBudgetPerPerson": number,
  "currency": "${currency}",
  "budgetLevel": "${budgetLevel}",
  "breakdown": {
    "flights": number,
    "accommodation": number,
    "food": number,
    "activities": number,
    "transportation": number,
    "miscellaneous": number
  },
  "dailyBreakdown": [
    {
      "date": "YYYY-MM-DD",
      "estimatedCost": number,
      "breakdown": {
        "accommodation": number,
        "food": number,
        "activities": number,
        "transportation": number
      },
      "activityDetails": [
        { "name": "Activity Name", "estimatedCost": number }
      ]
    }
  ],
  "budgetTips": [
    "tip1",
    "tip2",
    "tip3"
  ],
  "disclaimer": "Budget estimates are approximate and may vary based on actual prices and personal spending habits."
}
`;
}

function extractJsonFromResponse(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in OpenAI response');
  return JSON.parse(match[0]);
}
