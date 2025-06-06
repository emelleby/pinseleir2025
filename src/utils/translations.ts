/**
 * Norwegian translations for feedback form fields
 */

export const fieldTranslations: Record<string, string> = {
  // Main feedback fields
  enjoyment: 'Tilfredshet med seiltrening',
  learning: 'Læring og utvikling',
  social_connections: 'Sosiale forbindelser',
  food_quality: 'Matkvalitet',
  coach_quality: 'Instruktørkvalitet',
  organization: 'Organisering',
  safety: 'Sikkerhet',
  equipment: 'Utstyr',
  instructions: 'Instruksjoner',
  tempo: 'Tempo og intensitet',
  future_participation: 'Fremtidig deltakelse',
  recommendation: 'Anbefaling til andre',
  safety_measures: 'Sikkerhetstiltak',
  equipment_quality: 'Utstyrskvalitet',
  instruction_clarity: 'Instruksjonsklarhet',
  facilities: 'Fasiliteter',
  meals: 'Måltider',
  weather_handling: 'Værhåndtering',
  
  // Additional fields that might be in the database
  overall_satisfaction: 'Generell tilfredshet',
  instructor_feedback: 'Instruktørtilbakemelding',
  venue_rating: 'Stedsvurdering',
  activity_rating: 'Aktivitetsvurdering',
  communication: 'Kommunikasjon',
  value_for_money: 'Verdi for pengene',
};

/**
 * Get Norwegian translation for a field name
 */
export function getFieldTranslation(fieldName: string): string {
  return fieldTranslations[fieldName] || fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get short Norwegian translation for charts (max 20 characters)
 */
export function getShortFieldTranslation(fieldName: string): string {
  const shortTranslations: Record<string, string> = {
    enjoyment: 'Tilfredshet',
    learning: 'Læring',
    social_connections: 'Sosiale forbindelser',
    food_quality: 'Matkvalitet',
    coach_quality: 'Instruktør',
    organization: 'Organisering',
    safety: 'Sikkerhet',
    equipment: 'Utstyr',
    instructions: 'Instruksjoner',
    tempo: 'Tempo',
    future_participation: 'Fremtidig deltakelse',
    recommendation: 'Anbefaling',
    safety_measures: 'Sikkerhetstiltak',
    equipment_quality: 'Utstyrskvalitet',
    instruction_clarity: 'Instruksjonsklarhet',
    facilities: 'Fasiliteter',
    meals: 'Måltider',
    weather_handling: 'Værhåndtering',
  };

  return shortTranslations[fieldName] || getFieldTranslation(fieldName);
}
