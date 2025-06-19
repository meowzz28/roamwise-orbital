
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();
admin.initializeApp();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

exports.estimateBudget = onCall(  async (request) => {
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
