import { SYSTEM_PROMPT } from '../constants/systemPrompt';
import { DayType, MACRO_GOALS, DAY_TYPE_LABELS } from '../constants/macroGoals';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

async function callClaude(apiKey: string, userMessage: string): Promise<string> {
  if (!apiKey) throw new Error('Geen Claude API key ingesteld');

  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API fout: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

export interface DayAdviceInput {
  dayType: DayType;
  eaten: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  timeOfDay: string; // e.g. "14:30"
}

export async function getDayAdvice(apiKey: string, input: DayAdviceInput): Promise<string> {
  const goals = MACRO_GOALS[input.dayType];
  const remaining = {
    kcal: goals.kcal - input.eaten.kcal,
    protein_g: goals.protein_g - input.eaten.protein_g,
    carbs_g: goals.carbs_g - input.eaten.carbs_g,
    fat_g: goals.fat_g - input.eaten.fat_g,
  };

  const msg = `Het is ${input.timeOfDay}. Dagtype: ${DAY_TYPE_LABELS[input.dayType]}.

Gegeten vandaag:
- Calorieën: ${Math.round(input.eaten.kcal)} / ${goals.kcal} kcal
- Eiwitten: ${Math.round(input.eaten.protein_g)} / ${goals.protein_g}g
- Koolhydraten: ${Math.round(input.eaten.carbs_g)} / ${goals.carbs_g}g
- Vetten: ${Math.round(input.eaten.fat_g)} / ${goals.fat_g}g

Nog te eten:
- Calorieën: ${Math.round(remaining.kcal)} kcal
- Eiwitten: ${Math.round(remaining.protein_g)}g
- Koolhydraten: ${Math.round(remaining.carbs_g)}g
- Vetten: ${Math.round(remaining.fat_g)}g

Geef een kort dagadvies (2-3 zinnen) en 1-2 concrete maaltijd- of snacksuggesties voor de rest van de dag. Houd rekening met de allergie/intoleranties.`;

  return await callClaude(apiKey, msg);
}

export interface WeekAdviceInput {
  weekData: Array<{
    date: string;
    dayType: DayType;
    eaten: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
    goalMet: boolean;
  }>;
}

export async function getWeekAdvice(apiKey: string, input: WeekAdviceInput): Promise<string> {
  const weekSummary = input.weekData.map((d) => {
    const goals = MACRO_GOALS[d.dayType];
    return `${d.date} (${DAY_TYPE_LABELS[d.dayType]}): ${Math.round(d.eaten.kcal)}/${goals.kcal} kcal, E:${Math.round(d.eaten.protein_g)}g, K:${Math.round(d.eaten.carbs_g)}g, V:${Math.round(d.eaten.fat_g)}g`;
  }).join('\n');

  const msg = `Weekoverzicht voedselinname:
${weekSummary}

Analyseer de week en geef 2-4 concrete, persoonlijke tips voor verbetering. Benoem patronen en geef praktisch advies voor de komende dagen. Houd rekening met de allergie/intoleranties.`;

  return await callClaude(apiKey, msg);
}

export interface MealSuggestionInput {
  dayType: DayType;
  slotName: string;
  remaining: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  targetKcal?: number | null;
}

export async function getMealSuggestions(apiKey: string, input: MealSuggestionInput): Promise<string> {
  const msg = `Dagtype: ${DAY_TYPE_LABELS[input.dayType]}, maaltijdmoment: ${input.slotName}${input.targetKcal ? ` (doel: ~${input.targetKcal} kcal)` : ''}.

Resterende macroruimte voor vandaag:
- ${Math.round(input.remaining.kcal)} kcal
- Eiwitten: ${Math.round(input.remaining.protein_g)}g
- Koolhydraten: ${Math.round(input.remaining.carbs_g)}g
- Vetten: ${Math.round(input.remaining.fat_g)}g

Stel 3 concrete, creatieve maaltijdopties voor die passen bij dit moment en de resterende macroruimte. Geef per optie de naam, korte beschrijving en geschatte macros. Houd rekening met de allergie/intoleranties (geen noten/pinda's, lactosevrij, glutenvrij).`;

  return await callClaude(apiKey, msg);
}
