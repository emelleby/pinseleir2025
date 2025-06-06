
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const boatClasses = [
  'QA', 'QB', 'QC', 'QD', 'QE', 'QF', 'QG', 
  'ILCA4', 'ILCA6', '29er', 'FEVA'
];

const trainingDates = [
  { value: '2025-06-07', label: 'Dag 1 (7. juni)' },
  { value: '2025-06-08', label: 'Dag 2 (8. juni)' },
  { value: '2025-06-09', label: 'Dag 3 (9. juni)' }
];

const FeedbackForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    trainingDate: '',
    boatClass: '',
    // Kvantitative spørsmål (1-7 skala)
    enjoyment: 0,
    learning: 0,
    socialConnections: 0,
    foodQuality: 0,
    coachQuality: 0,
    organization: 0,
    safety: 0,
    equipment: 0,
    instructions: 0,
    tempo: 0,
    futureParticipation: 0,
    recommendation: 0,
    // Vurderingskategorier (1-7 skala)
    safetyMeasures: 0,
    equipmentQuality: 0,
    instructionClarity: 0,
    facilities: 0,
    meals: 0,
    weatherHandling: 0,
    // Kvalitative spørsmål
    bestPart: '',
    improvements: '',
    coachFeedback: '',
    recommendToNonSailors: '',
    otherComments: ''
  });

  const handleRatingChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trainingDate || !formData.boatClass) {
      toast({
        title: "Manglende informasjon",
        description: "Vennligst velg treningsdato og båtklasse.",
        variant: "destructive"
      });
      return;
    }

    // Here we'll add the database submission later
    console.log('Form data:', formData);
    
    toast({
      title: "Takk for din tilbakemelding!",
      description: "Dine svar har blitt registrert.",
    });
    
    // Reset form
    setFormData({
      trainingDate: '',
      boatClass: '',
      enjoyment: 0, learning: 0, socialConnections: 0, foodQuality: 0,
      coachQuality: 0, organization: 0, safety: 0, equipment: 0,
      instructions: 0, tempo: 0, futureParticipation: 0, recommendation: 0,
      safetyMeasures: 0, equipmentQuality: 0, instructionClarity: 0,
      facilities: 0, meals: 0, weatherHandling: 0,
      bestPart: '', improvements: '', coachFeedback: '',
      recommendToNonSailors: '', otherComments: ''
    });
  };

  const RatingScale = ({ field, label, value }: { field: string; label: string; value: number }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRatingChange(field, rating)}
            className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
              value === rating
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Tilbakemelding for seiltrening
          </CardTitle>
          <CardDescription className="text-center">
            Takk for at du deltok på vår seiltrening! Din tilbakemelding er verdifull for å hjelpe oss med å forbedre fremtidige økter.
            <br /><br />
            Dette skjemaet er helt anonymt. Ingen personlig informasjon vil bli samlet inn med mindre du velger å oppgi det i kommentarfeltene.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Obligatorisk informasjon */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treningsinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="trainingDate">Treningsdato *</Label>
                  <Select value={formData.trainingDate} onValueChange={(value) => setFormData(prev => ({...prev, trainingDate: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg treningsdato" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainingDates.map((date) => (
                        <SelectItem key={date.value} value={date.value}>
                          {date.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="boatClass">Båtklasse *</Label>
                  <Select value={formData.boatClass} onValueChange={(value) => setFormData(prev => ({...prev, boatClass: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg båtklasse" />
                    </SelectTrigger>
                    <SelectContent>
                      {boatClasses.map((boatClass) => (
                        <SelectItem key={boatClass} value={boatClass}>
                          {boatClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Kvantitative spørsmål */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Din opplevelse</CardTitle>
                <CardDescription>
                  Vennligst vurder din enighet med følgende utsagn på en skala fra 1 til 7:
                  <br />1 = Helt uenig, 7 = Helt enig
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RatingScale 
                  field="enjoyment" 
                  label="Alt i alt likte jeg dagens seiltrening" 
                  value={formData.enjoyment} 
                />
                <RatingScale 
                  field="learning" 
                  label="Jeg lærte verdifulle seilferdigheter i dag" 
                  value={formData.learning} 
                />
                <RatingScale 
                  field="socialConnections" 
                  label="Jeg fikk nye bekjentskaper/venner under dagens trening" 
                  value={formData.socialConnections} 
                />
                <RatingScale 
                  field="foodQuality" 
                  label="Maten som ble servert i dag var god" 
                  value={formData.foodQuality} 
                />
                <RatingScale 
                  field="coachQuality" 
                  label="Trenerne var kunnskapsrike og hjelpsomme" 
                  value={formData.coachQuality} 
                />
                <RatingScale 
                  field="organization" 
                  label="Treningsdagen var godt organisert" 
                  value={formData.organization} 
                />
                <RatingScale 
                  field="safety" 
                  label="Jeg følte meg trygg under hele treningsdagen" 
                  value={formData.safety} 
                />
                <RatingScale 
                  field="equipment" 
                  label="Båtene og utstyret var i god stand" 
                  value={formData.equipment} 
                />
                <RatingScale 
                  field="instructions" 
                  label="Instruksjonene fra trenerne var klare og forståelige" 
                  value={formData.instructions} 
                />
                <RatingScale 
                  field="tempo" 
                  label="Tempoet i treningen passet godt for mitt nivå" 
                  value={formData.tempo} 
                />
                <RatingScale 
                  field="futureParticipation" 
                  label="Jeg ønsker å delta på denne treningsleiren igjen neste år" 
                  value={formData.futureParticipation} 
                />
                <RatingScale 
                  field="recommendation" 
                  label="Jeg ville anbefalt denne seilleiren til andre" 
                  value={formData.recommendation} 
                />
              </CardContent>
            </Card>

            {/* Vurderingskategorier */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vurderingskategorier</CardTitle>
                <CardDescription>
                  Vennligst vurder følgende aspekter av dagens trening:
                  <br />1 = Dårlig, 7 = Utmerket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RatingScale 
                  field="safetyMeasures" 
                  label="Sikkerhetstiltak" 
                  value={formData.safetyMeasures} 
                />
                <RatingScale 
                  field="equipmentQuality" 
                  label="Utstyrskvalitet" 
                  value={formData.equipmentQuality} 
                />
                <RatingScale 
                  field="instructionClarity" 
                  label="Instruksjonsklarhet" 
                  value={formData.instructionClarity} 
                />
                <RatingScale 
                  field="facilities" 
                  label="Fasiliteter (garderober, toaletter, oppholdsrom)" 
                  value={formData.facilities} 
                />
                <RatingScale 
                  field="meals" 
                  label="Måltider" 
                  value={formData.meals} 
                />
                <RatingScale 
                  field="weatherHandling" 
                  label="Håndtering av værforhold" 
                  value={formData.weatherHandling} 
                />
              </CardContent>
            </Card>

            {/* Kvalitative spørsmål */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Åpen tilbakemelding</CardTitle>
                <CardDescription>
                  Vennligst del dine tanker om følgende spørsmål:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="bestPart">Hva var det beste med dagens trening?</Label>
                  <Textarea
                    id="bestPart"
                    value={formData.bestPart}
                    onChange={(e) => handleTextChange('bestPart', e.target.value)}
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="improvements">Hva kunne vært forbedret?</Label>
                  <Textarea
                    id="improvements"
                    value={formData.improvements}
                    onChange={(e) => handleTextChange('improvements', e.target.value)}
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="coachFeedback">Har du spesifikk tilbakemelding til trenerne?</Label>
                  <Textarea
                    id="coachFeedback"
                    value={formData.coachFeedback}
                    onChange={(e) => handleTextChange('coachFeedback', e.target.value)}
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recommendToNonSailors">Ville du anbefale denne leiren til venner som ikke seiler? Hvorfor/hvorfor ikke?</Label>
                  <Textarea
                    id="recommendToNonSailors"
                    value={formData.recommendToNonSailors}
                    onChange={(e) => handleTextChange('recommendToNonSailors', e.target.value)}
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="otherComments">Andre kommentarer eller forslag</Label>
                  <Textarea
                    id="otherComments"
                    value={formData.otherComments}
                    onChange={(e) => handleTextChange('otherComments', e.target.value)}
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full py-3 text-lg">
              Send tilbakemelding
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackForm;
