import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LogOut, Filter, Trash2, ChevronDown, X, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getShortFieldTranslation } from '@/utils/translations';

interface AdminDashboardProps {
  onLogout: () => void;
  sessionId: string;
}

const boatClasses = [
  'QA', 'QB', 'QC', 'QD', 'QE', 'QF', 'QG',
  'ILCA4', 'ILCA6', '29er', 'FEVA'
];

const trainingDates = [
  { value: '2025-06-07', label: 'Dag 1 (7. juni)' },
  { value: '2025-06-08', label: 'Dag 2 (8. juni)' },
  { value: '2025-06-09', label: 'Dag 3 (9. juni)' }
];

const AdminDashboard = ({ onLogout, sessionId }: AdminDashboardProps) => {
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [excludedClasses, setExcludedClasses] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper functions for managing excluded classes
  const toggleClassExclusion = (className: string) => {
    setExcludedClasses(prev =>
      prev.includes(className)
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const removeClassExclusion = (className: string) => {
    setExcludedClasses(prev => prev.filter(c => c !== className));
  };

  const excludeAllClasses = () => {
    setExcludedClasses([...boatClasses]);
  };

  const clearAllFilters = () => {
    setSelectedDate('all');
    setExcludedClasses([]);
  };

  const { data: feedbackData, isLoading, error } = useQuery({
    queryKey: ['feedback', selectedDate, excludedClasses, sessionId],
    queryFn: async () => {
      console.log('Fetching feedback data for admin session:', sessionId);

      // Build the query for feedback data
      let query = supabase.from('feedback').select('*');

      if (selectedDate && selectedDate !== 'all') {
        query = query.eq('training_date', selectedDate);
      }
      if (excludedClasses.length > 0) {
        query = query.not('boat_class', 'in', `(${excludedClasses.join(',')})`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.error('Feedback query error:', error);
        throw error;
      }

      console.log('Feedback data loaded:', data?.length || 0, 'records');
      return data || [];
    }
  });

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      console.log('Attempting to delete feedback with ID:', feedbackId);

      const { data, error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId)
        .select(); // This will return the deleted row(s) if successful

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Delete successful, deleted rows:', data);

      if (!data || data.length === 0) {
        throw new Error('Ingen rader ble slettet. Tilbakemeldingen finnes kanskje ikke.');
      }

      return data;
    },
    onSuccess: (deletedData) => {
      console.log('Delete mutation successful:', deletedData);
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast({
        title: "Tilbakemelding slettet",
        description: "Tilbakemeldingen har blitt slettet fra databasen.",
      });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
      toast({
        title: "Sletting feilet",
        description: `Kunne ikke slette tilbakemelding: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    onLogout();
    toast({
      title: "Logget ut",
      description: "Du har blitt logget ut av admin-panelet.",
    });
  };

  const calculateAverages = () => {
    if (!feedbackData || feedbackData.length === 0) {
      return {};
    }

    // Get all numeric fields from the first record to see what's available
    const firstRecord = feedbackData[0];
    const numericFields = Object.keys(firstRecord).filter(key => {
      const value = firstRecord[key as keyof typeof firstRecord];
      return typeof value === 'number' && !isNaN(value);
    });

    const averages: Record<string, number> = {};

    numericFields.forEach(field => {
      const values = feedbackData
        .map(item => item[field as keyof typeof item])
        .filter(val => val !== null && val !== undefined && typeof val === 'number' && !isNaN(val)) as number[];

      if (values.length > 0) {
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        if (!isNaN(average) && isFinite(average)) {
          averages[field] = average;
        }
      }
    });

    return averages;
  };

  const getChartData = () => {
    const averages = calculateAverages();
    return Object.entries(averages)
      .filter(([, value]) => !isNaN(value) && isFinite(value))
      .map(([key, value]) => ({
        name: getShortFieldTranslation(key),
        value: Math.round(value * 10) / 10
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  };

  const getResponsesByDay = () => {
    if (!feedbackData || feedbackData.length === 0) return [];

    const grouped = feedbackData.reduce((acc: Record<string, number>, item) => {
      const date = item.training_date;
      if (date) {
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .filter(([date, count]) => date && count > 0)
      .map(([date, count]) => ({
        date: trainingDates.find(d => d.value === date)?.label || date,
        responses: count
      }));
  };

  const getResponsesByClass = () => {
    if (!feedbackData || feedbackData.length === 0) return [];

    const grouped = feedbackData.reduce((acc: Record<string, number>, item) => {
      const boatClass = item.boat_class;
      if (boatClass) {
        acc[boatClass] = (acc[boatClass] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(grouped)
      .filter(([boatClass, count]) => boatClass && count > 0)
      .map(([boatClass, count]) => ({
        class: boatClass,
        responses: count
      }));
  };

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600 mb-4">Feil ved lasting av data: {error.message}</p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Feilsøkingsinformasjon:</strong></p>
                <p>Session ID: {sessionId}</p>
                <p>Tidspunkt: {new Date().toLocaleString('no-NO')}</p>
                <Button onClick={handleLogout} variant="outline" className="mt-4">
                  <LogOut className="w-4 h-4 mr-2" />
                  Prøv å logge inn på nytt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Tilbakemeldingsstatistikk</h1>
          <div className="flex gap-2">
            <Button onClick={() => window.location.href = '/admin/qualitative'} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Kvalitative svar
            </Button>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Logg ut
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtrer resultater
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle dager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle dager</SelectItem>
                    {trainingDates.map((date) => (
                      <SelectItem key={date.value} value={date.value}>
                        {date.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <div className="space-y-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        Ekskluder båtklasser
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Velg klasser å ekskludere</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {boatClasses.map((boatClass) => (
                        <DropdownMenuItem
                          key={boatClass}
                          className="flex items-center space-x-2"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Checkbox
                            id={`class-${boatClass}`}
                            checked={excludedClasses.includes(boatClass)}
                            onCheckedChange={() => toggleClassExclusion(boatClass)}
                          />
                          <Label
                            htmlFor={`class-${boatClass}`}
                            className="flex-1 cursor-pointer"
                          >
                            {boatClass}
                          </Label>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Badges for excluded classes */}
                  {excludedClasses.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {excludedClasses.map((className) => (
                        <Badge
                          key={className}
                          variant="destructive"
                          className="cursor-pointer"
                          onClick={() => removeClassExclusion(className)}
                        >
                          {className}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={excludeAllClasses}
                disabled={excludedClasses.length === boatClasses.length}
              >
                Ekskluder alle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                disabled={selectedDate === 'all' && excludedClasses.length === 0}
              >
                Nullstill alle filtre
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <p>Laster data...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Totalt antall svar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{feedbackData?.length || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gjennomsnittlig tilfredshet</CardTitle>
                  <CardDescription>Basert på "Alt i alt likte jeg dagens seiltrening"</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {(() => {
                      if (!feedbackData || feedbackData.length === 0) return 'N/A';
                      const validValues = feedbackData
                        .filter(item => item.enjoyment !== null && item.enjoyment !== undefined && !isNaN(item.enjoyment))
                        .map(item => item.enjoyment);
                      if (validValues.length === 0) return 'N/A';
                      const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
                      return isNaN(average) ? 'N/A' : average.toFixed(1);
                    })()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Anbefaling</CardTitle>
                  <CardDescription>Gjennomsnitt for "Jeg ville anbefalt denne seilleiren til andre"</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {(() => {
                      if (!feedbackData || feedbackData.length === 0) return 'N/A';
                      const validValues = feedbackData
                        .filter(item => item.recommendation !== null && item.recommendation !== undefined && !isNaN(item.recommendation))
                        .map(item => item.recommendation);
                      if (validValues.length === 0) return 'N/A';
                      const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
                      return isNaN(average) ? 'N/A' : average.toFixed(1);
                    })()}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Svar per dag</CardTitle>
                </CardHeader>
                <CardContent>
                  {getResponsesByDay().length > 0 ? (
                    <ChartContainer
                      config={{
                        responses: {
                          label: "Antall svar",
                          color: "hsl(217, 91%, 60%)", // Blue
                        },
                      } satisfies ChartConfig}
                      className="h-[300px]"
                    >
                      <BarChart accessibilityLayer data={getResponsesByDay()}>
                        <defs>
                          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                            <stop offset="100%" stopColor="hsl(217, 91%, 80%)" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="responses" fill="url(#blueGradient)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <p>Ingen data tilgjengelig for valgte filtre</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Svar per båtklasse</CardTitle>
                </CardHeader>
                <CardContent>
                  {getResponsesByClass().length > 0 ? (
                    <ChartContainer
                      config={{
                        responses: {
                          label: "Antall svar",
                          color: "hsl(142, 76%, 36%)", // Green
                        },
                      } satisfies ChartConfig}
                      className="h-[300px]"
                    >
                      <BarChart accessibilityLayer data={getResponsesByClass()}>
                        <defs>
                          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(142, 76%, 36%)" />
                            <stop offset="100%" stopColor="hsl(142, 76%, 56%)" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="class"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="responses" fill="url(#greenGradient)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      <p>Ingen data tilgjengelig for valgte filtre</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

             {/* Average Ratings */}
            <Card>
              <CardHeader>
                <CardTitle>Gjennomsnittlige vurderinger</CardTitle>
                <CardDescription>Alle spørsmål på 1-7 skala</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const chartData = getChartData();
                  console.log('chartData', chartData);

                  if (chartData.length === 0) {
                    return (
                      <div className="h-[400px] flex items-center justify-center text-gray-500">
                        <p>Ingen data tilgjengelig for valgte filtre</p>
                      </div>
                    );
                  }

                  return (
                    <ChartContainer
                      config={{
                        value: {
                          label: "Gjennomsnitt",
                          color: "hsl(262, 83%, 58%)", // Purple
                        },
                      } satisfies ChartConfig}
                      className="h-[600px]"
                    >
                      <BarChart
                        accessibilityLayer
                        data={chartData}
                        layout="vertical"
                        margin={{
                          left: 100,
                          right: 20,
                          top: 20,
                          bottom: 20,
                        }}
                      >
                        <defs>
                          <linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
                            <stop offset="50%" stopColor="hsl(262, 83%, 68%)" />
                            <stop offset="100%" stopColor="hsl(262, 83%, 78%)" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          domain={[0, 7]}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={120}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => {
                            // Truncate long labels for better display
                            return value.length > 20 ? `${value.slice(0, 30)}...` : value;
                          }}
                        />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar
                          dataKey="value"
                          fill="url(#purpleGradient)"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Siste tilbakemeldinger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackData?.slice(0, 5).map((feedback) => (
                    <div key={feedback.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {trainingDates.find(d => d.value === feedback.training_date)?.label || feedback.training_date} - {feedback.boat_class}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(feedback.created_at).toLocaleString('no-NO')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Tilfredshet: {feedback.enjoyment || 'N/A'}/7</p>
                          <p className="text-sm">Anbefaling: {feedback.recommendation || 'N/A'}/7</p>
                        </div>
                      </div>
                      {feedback.best_part && (
                        <p className="mt-2 text-sm italic">"{feedback.best_part}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feedback Management Table */}
            <Card>
              <CardHeader>
                <CardTitle>Administrer tilbakemeldinger</CardTitle>
                <CardDescription>
                  Oversikt over alle tilbakemeldinger med mulighet for sletting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackData && feedbackData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dato</TableHead>
                        <TableHead>Båtklasse</TableHead>
                        <TableHead>Tilfredshet</TableHead>
                        <TableHead>Anbefaling</TableHead>
                        <TableHead>Opprettet</TableHead>
                        <TableHead>Handlinger</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackData.map((feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell>
                            {trainingDates.find(d => d.value === feedback.training_date)?.label || feedback.training_date}
                          </TableCell>
                          <TableCell>{feedback.boat_class}</TableCell>
                          <TableCell>{feedback.enjoyment || 'N/A'}/7</TableCell>
                          <TableCell>{feedback.recommendation || 'N/A'}/7</TableCell>
                          <TableCell>
                            {new Date(feedback.created_at).toLocaleString('no-NO')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (window.confirm('Er du sikker på at du vil slette denne tilbakemeldingen? Dette kan ikke angres.')) {
                                  deleteFeedbackMutation.mutate(feedback.id);
                                }
                              }}
                              disabled={deleteFeedbackMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Ingen tilbakemeldinger funnet</p>
                    <p className="text-sm mt-2">
                      {selectedDate !== 'all' || excludedClasses.length > 0
                        ? 'Prøv å endre filtrene ovenfor'
                        : 'Det er ingen data i databasen ennå'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
