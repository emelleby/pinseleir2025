import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Filter, Search, ChevronDown, X, Download } from 'lucide-react';
import { isAdminLoggedIn, getAdminSessionId } from '@/utils/adminAuth';

const boatClasses = [
  'QA', 'QB', 'QC', 'QD', 'QE', 'QF', 'QG',
  'ILCA4', 'ILCA6', '29er', 'FEVA'
];

const trainingDates = [
  { value: '2025-06-07', label: 'Dag 1 (7. juni)' },
  { value: '2025-06-08', label: 'Dag 2 (8. juni)' },
  { value: '2025-06-09', label: 'Dag 3 (9. juni)' }
];

// Helper component for displaying text with modal for longer content
const TextCell = ({ text, title }: { text: string | null; title: string }) => {
  if (!text || !text.trim()) {
    return <span className="text-gray-400 text-sm">Ikke besvart</span>;
  }

  const isLong = text.length > 100;

  return (
    <div className="text-sm">
      <p className="line-clamp-3 whitespace-pre-wrap">
        {text}
      </p>
      {isLong && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-xs text-gray-500">
            {text.length} tegn
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-6">
                Les mer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {text}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

const QualitativeData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [excludedClasses, setExcludedClasses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Check if user is logged in
    if (!isAdminLoggedIn()) {
      navigate('/admin');
      return;
    }
    const storedSessionId = getAdminSessionId();
    setSessionId(storedSessionId);
  }, [navigate]);

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
    setSearchTerm('');
    setCurrentPage(1);
  };

  const { data: feedbackData, isLoading, error } = useQuery({
    queryKey: ['qualitative-feedback', selectedDate, excludedClasses, sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      console.log('Fetching qualitative feedback data for admin session:', sessionId);

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
        console.error('Qualitative feedback query error:', error);
        throw error;
      }

      console.log('Qualitative feedback data loaded:', data?.length || 0, 'records');
      return data || [];
    },
    enabled: !!sessionId
  });

  // Filter data based on search term
  const filteredData = feedbackData?.filter(feedback => {
    if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
    return (
      (feedback.best_part && feedback.best_part.toLowerCase().includes(searchLower)) ||
      (feedback.improvements && feedback.improvements.toLowerCase().includes(searchLower)) ||
      (feedback.coach_feedback && feedback.coach_feedback.toLowerCase().includes(searchLower)) ||
      (feedback.recommend_to_non_sailors && feedback.recommend_to_non_sailors.toLowerCase().includes(searchLower)) ||
      (feedback.other_comments && feedback.other_comments.toLowerCase().includes(searchLower))
    );
  }) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, excludedClasses, searchTerm]);

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      toast({
        title: "Ingen data å eksportere",
        description: "Det er ingen data som matcher de valgte filtrene.",
        variant: "destructive"
      });
      return;
    }

    // Create CSV headers
    const headers = [
      'Dato',
      'Båtklasse',
      'Beste del',
      'Forbedringer',
      'Trener-tilbakemelding',
      'Anbefaling til ikke-seilere',
      'Andre kommentarer',
      'Opprettet'
    ];

    // Create CSV rows
    const rows = filteredData.map(feedback => [
      trainingDates.find(d => d.value === feedback.training_date)?.label || feedback.training_date,
      feedback.boat_class,
      feedback.best_part || '',
      feedback.improvements || '',
      feedback.coach_feedback || '',
      feedback.recommend_to_non_sailors || '',
      feedback.other_comments || '',
      new Date(feedback.created_at).toLocaleString('no-NO')
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kvalitative-tilbakemeldinger-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Eksport fullført",
      description: `${filteredData.length} svar eksportert til CSV.`,
    });
  };

  if (!sessionId) {
    return null; // Will redirect to admin login
  }

  if (error) {
    console.error('Qualitative data error:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <p className="text-red-600 mb-4">Feil ved lasting av data: {error.message}</p>
              <Button onClick={() => navigate('/admin')} variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake til dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            <h1 className="text-3xl font-bold">Kvalitative tilbakemeldinger</h1>
          </div>
          <Button onClick={exportToCSV} variant="outline" disabled={!filteredData || filteredData.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Eksporter CSV
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
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Søk i tekst..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
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
                disabled={selectedDate === 'all' && excludedClasses.length === 0 && !searchTerm}
              >
                Nullstill alle filtre
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Oversikt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{filteredData.length}</p>
                <p className="text-sm text-gray-600">Totalt antall svar</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {filteredData.filter(f => f.best_part && f.best_part.trim()).length}
                </p>
                <p className="text-sm text-gray-600">Med "beste del" svar</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {filteredData.filter(f => f.improvements && f.improvements.trim()).length}
                </p>
                <p className="text-sm text-gray-600">Med forbedringsforslag</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualitative Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Kvalitative svar</CardTitle>
            <CardDescription>
              Alle tekstsvar fra tilbakemeldingsskjemaet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>Laster data...</p>
              </div>
            ) : paginatedData.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Dato</TableHead>
                        <TableHead className="w-[80px]">Klasse</TableHead>
                        <TableHead className="w-[200px]">Beste del</TableHead>
                        <TableHead className="w-[200px]">Forbedringer</TableHead>
                        <TableHead className="w-[200px]">Trener-tilbakemelding</TableHead>
                        <TableHead className="w-[200px]">Anbefaling til ikke-seilere</TableHead>
                        <TableHead className="w-[200px]">Andre kommentarer</TableHead>
                        <TableHead className="w-[120px]">Opprettet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell>
                            {trainingDates.find(d => d.value === feedback.training_date)?.label || feedback.training_date}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{feedback.boat_class}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <TextCell
                              text={feedback.best_part}
                              title="Hva var det beste med dagens trening?"
                            />
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <TextCell
                              text={feedback.improvements}
                              title="Hva kunne vært forbedret?"
                            />
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <TextCell
                              text={feedback.coach_feedback}
                              title="Har du spesifikk tilbakemelding til trenerne?"
                            />
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <TextCell
                              text={feedback.recommend_to_non_sailors}
                              title="Ville du anbefale denne leiren til venner som ikke seiler?"
                            />
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <TextCell
                              text={feedback.other_comments}
                              title="Andre kommentarer eller forslag"
                            />
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(feedback.created_at).toLocaleString('no-NO')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Viser {startIndex + 1}-{Math.min(endIndex, filteredData.length)} av {filteredData.length} svar
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Forrige
                      </Button>
                      <span className="text-sm">
                        Side {currentPage} av {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Neste
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Ingen kvalitative svar funnet</p>
                <p className="text-sm mt-2">
                  {selectedDate !== 'all' || excludedClasses.length > 0 || searchTerm
                    ? 'Prøv å endre filtrene ovenfor'
                    : 'Det er ingen tekstsvar i databasen ennå'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QualitativeData;