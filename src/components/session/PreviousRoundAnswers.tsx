
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users2 } from "lucide-react";

interface PreviousAnswer {
  respondant_name: string;
  agreement_level: number;
  confidence_level: number;
  comment: string | null;
}

interface PreviousRoundAnswersProps {
  answers: PreviousAnswer[];
  statement: string;
}

export const PreviousRoundAnswers = ({ answers, statement }: PreviousRoundAnswersProps) => {
  if (!answers.length) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto mb-8">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-xl">Previous Round Responses</CardTitle>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Statement: {statement}
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Member</TableHead>
              <TableHead>Agreement</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {answers.map((answer, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{answer.respondant_name}</TableCell>
                <TableCell>{answer.agreement_level}/10</TableCell>
                <TableCell>{answer.confidence_level}/10</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
