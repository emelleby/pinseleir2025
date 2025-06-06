import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogOut, Filter, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: feedbackData, isLoading, error } = useQuery({
    queryKey: ['feedback', selectedDate, selectedClass, sessionId],
    queryFn: async () => {
      console.log('Validating admin session:', sessionId);
      
      // First validate the admin session with better error handling
      const { data: sessionCheck, error: sessionError } = await supabase
        .from('admin_sessions')
        .select('id, expires_at')
        .eq('session_id', sessionId)
        .maybeSingle();

      console.log('Session check result:', { sessionCheck, sessionError });

      if (sessionError) {
        console.error('Session check error:', sessionError);
        throw new Error(`Database error: ${sessionError.message}`);
      }

      if (!sessionCheck) {
        console.error('No session found for session_id:', sessionId);
        throw new Error('Invalid admin session - session not found');
      }

      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(sessionCheck.expires_at);
      if (expiresAt <= now) {
        console.error('Session expired:', { expiresAt, now });
        throw new Error('Admin session has expired');
      }

      console.log('Session validated successfully');

      // Build the query for feedback data
      let query = supabase.from('feedback').select('*');
      
      if (selectedDate && selectedDate !== 'all') {
        query = query.eq('training_date', selectedDate);
      }
      if (selectedClass && selectedClass !== 'all') {
        query = query.eq('boat_class', selectedClass);
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
      // Validate session again before deletion
      const { data: sessionCheck } = await supabase
        .from('admin_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!sessionCheck) {
        throw new Error('Invalid or expired admin session');
      }

      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast({
        title: "Tilbakemelding slettet",
        description: "Tilbakemeldingen har blitt slettet fra databasen.",
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: "Sletting feilet",
        description: `Kunne ikke slette tilbakemelding: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_session_id');
    onLogout();
    toast({
      title: "Logget ut",
      description: "Du har blitt logget ut av admin-panelet.",
    });
  };

  const calculateAverages = () => {
    if (!feedbackData || feedbackData.length === 0) return {};

    const fields = [
      'enjoyment', 'learning', 'social_connections', 'food_quality',
      'coach_quality', 'organization', 'safety', 'equipment',
      'instructions', 'tempo', 'future_participation', 'recommendation',
      'safety_measures', 'equipment_quality', 'instruction_clarity',
      'facilities', 'meals', 'weather_handling'
    ];

    const averages: Record<string, number> = {};
    
    fields.forEach(field => {
      const values = feedbackData
        .map(item => item[field as keyof typeof item])
        .filter(val => val !== null && val !== undefined) as number[];
      
      if (values.length > 0) {
        averages[field] = values.reduce((sum, val) => sum + val, 0) / values.length;
      }
    });

    return averages;
  };

  const getChartData = () => {
    const averages = calculateAverages();
    return Object.entries(averages).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: Math.round(value * 10) / 10
    }));
  };

  const getResponsesByDay = () => {
    if (!feedbackData) return [];
    
    const grouped = feedbackData.reduce((acc: Record<string, number>, item) => {
      const date = item.training_date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, count]) => ({
      date: trainingDates.find(d => d.value === date)?.label || date,
      responses: count
    }));
  };

  const getResponsesByClass = () => {
    if (!feedbackData) return [];
    
    const grouped = feedbackData.reduce((acc: Record<string, number>, item) => {
      const boatClass = item.boat_class;
      acc[boatClass] = (acc[boatClass] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([boatClass, count]) => ({
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
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logg ut
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtrer resultater
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
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
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle båtklasser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle båtklasser</SelectItem>
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
                    {feedbackData && feedbackData.length > 0 
                      ? (feedbackData
                          .filter(item => item.enjoyment !== null)
                          .reduce((sum, item) => sum + (item.enjoyment || 0), 0) / 
                         feedbackData.filter(item => item.enjoyment !== null).length
                        ).toFixed(1)
                      : 'N/A'
                    }
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
                    {feedbackData && feedbackData.length > 0 
                      ? (feedbackData
                          .filter(item => item.recommendation !== null)
                          .reduce((sum, item) => sum + (item.recommendation || 0), 0) / 
                         feedbackData.filter(item => item.recommendation !== null).length
                        ).toFixed(1)
                      : 'N/A'
                    }
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Svar per dag</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getResponsesByDay()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="responses" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Svar per båtklasse</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getResponsesByClass()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="class" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="responses" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getChartData()} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 7]} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
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
                              onClick={() => deleteFeedbackMutation.mutate(feedback.id)}
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
                      {selectedDate !== 'all' || selectedClass !== 'all' 
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
