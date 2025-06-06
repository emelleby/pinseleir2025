import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";

const boatClasses = [
  "QA",
  "QB",
  "QC",
  "QD",
  "QE",
  "QF",
  "QG",
  "ILCA4",
  "ILCA6",
  "29er",
  "FEVA",
  "Forelder",
  "Trener",
  "Annet",
];

const trainingDates = [
  { value: "2025-06-07", label: "Dag 1 (7. juni)" },
  { value: "2025-06-08", label: "Dag 2 (8. juni)" },
  { value: "2025-06-09", label: "Dag 3 (9. juni)" },
];

const FeedbackForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    trainingDate: "",
    boatClass: "",
    // Kvantitative spørsmål (1-7 skala)
    enjoyment: 0,
    learning: 0,
    socialConnections: 0,
    foodQuality: 0,
    coachQuality: 0,
    organization: 0,
    safety: 0,
    help: 0,
    instructions: 0,
    tempo: 0,
    futureParticipation: 0,
    recommendation: 0,
    // Vurderingskategorier (1-7 skala)
    safetyMeasures: 0,
    instructionClarity: 0,
    facilities: 0,
    meals: 0,
    weatherHandling: 0,
    // Kvalitative spørsmål
    bestPart: "",
    improvements: "",
    coachFeedback: "",
    recommendToNonSailors: "",
    otherComments: "",
  });

  const submitFeedback = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("feedback").insert({
        training_date: data.trainingDate,
        boat_class: data.boatClass,
        enjoyment: data.enjoyment || null,
        learning: data.learning || null,
        social_connections: data.socialConnections || null,
        food_quality: data.foodQuality || null,
        coach_quality: data.coachQuality || null,
        organization: data.organization || null,
        safety: data.safety || null,
        help: data.help || null,
        instructions: data.instructions || null,
        tempo: data.tempo || null,
        future_participation: data.futureParticipation || null,
        recommendation: data.recommendation || null,
        safety_measures: data.safetyMeasures || null,
        instruction_clarity: data.instructionClarity || null,
        facilities: data.facilities || null,
        meals: data.meals || null,
        weather_handling: data.weatherHandling || null,
        best_part: data.bestPart || null,
        improvements: data.improvements || null,
        coach_feedback: data.coachFeedback || null,
        recommend_to_non_sailors: data.recommendToNonSailors || null,
        other_comments: data.otherComments || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Takk for din tilbakemelding!",
        description: "Dine svar har blitt registrert.",
      });

      // Reset form
      setFormData({
        trainingDate: "",
        boatClass: "",
        enjoyment: 0,
        learning: 0,
        socialConnections: 0,
        foodQuality: 0,
        coachQuality: 0,
        organization: 0,
        safety: 0,
        help: 0,
        instructions: 0,
        tempo: 0,
        futureParticipation: 0,
        recommendation: 0,
        safetyMeasures: 0,
        instructionClarity: 0,
        facilities: 0,
        meals: 0,
        weatherHandling: 0,
        bestPart: "",
        improvements: "",
        coachFeedback: "",
        recommendToNonSailors: "",
        otherComments: "",
      });
    },
    onError: (error) => {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Feil ved innsending",
        description: "Det oppstod en feil. Prøv igjen senere.",
        variant: "destructive",
      });
    },
  });

  const handleRatingChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.trainingDate || !formData.boatClass) {
      toast({
        title: "Manglende informasjon",
        description: "Vennligst velg treningsdato og båtklasse.",
        variant: "destructive",
      });
      return;
    }

    submitFeedback.mutate(formData);
  };

  const RatingScale = ({
    field,
    label,
    value,
  }: {
    field: string;
    label: string;
    value: number;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleRatingChange(field, rating)}
            className={`w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
              value === rating
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:border-blue-400"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto sm:p-6 space-y-8">
      <Card>
        <CardHeader className="p-4 ">
          <CardTitle className="text-2xl font-bold text-center">
            Tilbakemelding for Pinseleir 2025
          </CardTitle>
          <CardDescription className="text-center">
            Takk for at du deltar på Pinseleir 2025! Din tilbakemelding er
            verdifull for å hjelpe oss med å forbedre neste års samling. Send
            inn et svar hver dag er du snill.
            <br />
            <br />
            Dette skjemaet er helt anonymt, så vær dønn ærlig. Bruk skalaen!
            Ingen personlig informasjon vil bli samlet inn med mindre du velger
            å oppgi det i kommentarfeltene.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Obligatorisk informasjon */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Treningsinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="trainingDate">Treningsdato *</Label>
                  <Select
                    value={formData.trainingDate}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, trainingDate: value }))
                    }
                  >
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
                  <Select
                    value={formData.boatClass}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, boatClass: value }))
                    }
                  >
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
                  Vennligst vurder din enighet med følgende utsagn på en skala
                  fra 1 til 7:
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
                  label="Jeg fikk nye eller bedre bekjentskaper/venner i dag"
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
                  field="help"
                  label="Jeg følte jeg ble sett og fikk hjelp av treneren"
                  value={formData.help}
                />
                <RatingScale
                  field="instructions"
                  label="Instruksjonene fra trenerne var klare og forståelige"
                  value={formData.instructions}
                />
                <RatingScale
                  field="tempo"
                  label="Tempoet/nivået i treningen passet godt for meg og mitt nivå"
                  value={formData.tempo}
                />
                <RatingScale
                  field="futureParticipation"
                  label="Jeg ønsker å delta på denne Pinseleiren igjen neste år"
                  value={formData.futureParticipation}
                />
                <RatingScale
                  field="recommendation"
                  label="Jeg vil anbefale Pinseleiren til andre seilere i min klubb"
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
                  <Label htmlFor="bestPart">
                    Hva var det beste med dagens trening?
                  </Label>
                  <Textarea
                    id="bestPart"
                    value={formData.bestPart}
                    onChange={(e) =>
                      handleTextChange("bestPart", e.target.value)
                    }
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="improvements">
                    Hva kunne vært forbedret?
                  </Label>
                  <Textarea
                    id="improvements"
                    value={formData.improvements}
                    onChange={(e) =>
                      handleTextChange("improvements", e.target.value)
                    }
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="coachFeedback">
                    Har du spesifikk tilbakemelding til trenerne?
                  </Label>
                  <Textarea
                    id="coachFeedback"
                    value={formData.coachFeedback}
                    onChange={(e) =>
                      handleTextChange("coachFeedback", e.target.value)
                    }
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="recommendToNonSailors">
                    Ville du anbefale denne leiren til venner som ikke seiler?
                    Hvorfor/hvorfor ikke?
                  </Label>
                  <Textarea
                    id="recommendToNonSailors"
                    value={formData.recommendToNonSailors}
                    onChange={(e) =>
                      handleTextChange("recommendToNonSailors", e.target.value)
                    }
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="otherComments">
                    Andre kommentarer eller forslag
                  </Label>
                  <Textarea
                    id="otherComments"
                    value={formData.otherComments}
                    onChange={(e) =>
                      handleTextChange("otherComments", e.target.value)
                    }
                    placeholder="Skriv din tilbakemelding her..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full py-3 text-lg"
              disabled={submitFeedback.isPending}
            >
              {submitFeedback.isPending ? "Sender..." : "Send tilbakemelding"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subtle admin link */}
      <div className="text-center">
        <a
          href="/admin"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          •
        </a>
      </div>
    </div>
  );
};

export default FeedbackForm;
